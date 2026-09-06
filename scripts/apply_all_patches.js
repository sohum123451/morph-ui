const fs = require('fs');

let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Identify & Add Icons
if (!code.includes('PanelLeft')) {
  code = code.replace(
    'ArrowRight,\n} from \'locide-react\';',
    'ArrowRight,\n  PanelLeft,\n  History,\n  Trash2,\n  Clock,\n} from \'locide-react\';'
  );
}

// 2. Add Sidebar State & Handlers
if (!code.includes('isSidebarOpen')) {
  const stateMarker = "const [tableSearch, setTableSearch] = useState('');";
  const stateSnippet = `const [tableSearch, setTableSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array>{ id: string; title: string; created_at: string }>>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchChatHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/chats');
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.chats || []);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const handleSelectChat = async (chatId: string) => {
    try {
      setLoading(true);
      setError(null);
      setActiveChatId(chatId);
      setIsSidebarOpen(false);
      const res = await fetch('/api/chats/' + chatId);
      if (!res.ok) throw new Error('Failed to load chat');
      const data = await res.json();

      const assistantMsg = data.messages?.find((m: any) => m.sender === 'assistant' && m.payload);
      const userMsg = data.messages?.find((m: any) => m.sender === 'user' && m.payload);

      if (userMsg?.payload?.prompt) {
        setPrompt(userMsg.payload.prompt);
      } else if (data.chat?.title) {
        setPrompt(data.chat.title);
      }

      if (assistantMsg?.payload) {
        const comp = assistantMsg.payload;
        let resolvedEntities: EntityVerdict[] = [];
        if (Array.isArray(comp.entities) && comp.entities.length > 0) {
          resolvedEntities = comp.entities.map((e: any, idx: number) => {
            const name = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : [`Option ${String.fromCharCode(65 + idx)}`];
            const pros = typeof e === 'object' && Array.isArray(e?.pros)
              ? e.pros.map(String).filter((p: string) => !isMissingVerdictBullet(p))
              : [];
            return {
              name,
              pros: pros.length > 0 ? pros : [`Established baseline capabilities for ${name}`],
            };
          });
        } else if (comp.entity_a && comp.entity_b) {
          resolvedEntities = [comp.entity_a, comp.entity_b];
        }

        let resolvedCategories = comp.categories || {};
        if (Object.keys(resolvedCategories).length === 0 && Array.isArray(comp.verified_metrics)) {
          resolvedCategories = { [comp.category || 'Core Specifications']: comp.verified_metrics };
        }

        setComparisonData({
          category: comp.category || 'Comparative Analysis',
          entities: resolvedEntities,
          entity_a: resolvedEntities[0],
          entity_b: resolvedEntities[1],
          categories: resolvedCategories,
          verified_metrics: Object.values(resolvedCategories).flat() as VerifiedMetric[],
          community_sentiment: Array.isArray(comp.community_sentiment) ? comp.community_sentiment : [],
          suggested_metrics: Array.isArray(comp.suggested_metrics) ? comp.suggested_metrics : [],
          verdict_summary: comp.verdict_summary || '',
          comparison_points: comp.comparison_points || [],
        });
      }
    } catch (err: any) {
      console.error('Error loading chat:', err);
      setError(err?.message || 'Could not load historical comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/chats?id=' + chatId, { method: 'DELETE' });
      setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.warn('Failed to load chat history:', err);
    }
  };

  const handleNewComparison = () => {
    setComparisonData(null);
    setPrompt('');
    setActiveChatId(null);
    setError(null);
    setUploadedImages([]);
    setIsSidebarOpen(false);
  };`;
  code = code.replace(stateMarker, stateSnippet);
}

// 3. In handleRunComparison, save chat_id & refresh chat history
if (!code.includes('fetchChatHistory();')) {
  code = code.replace(
    'setOpenSections({});',
    'setOpenSections({});\n      if (data.chat_id) setActiveChatId(data.chat_id);\n      fetchChatHistory();'
  );
}

// 4. Sidebar Drawer JSX
const sidebarDrawer = `      {/*Collapsible Chat History Left Sidebar Drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Comparison History</h3>
              <span className="text-[10px] text-slate-400 font-mono">Turso + AES-GCM Encrypted</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-800">
          <button
            type="button"
            onClick={handleNewComparison}
            className="w-full py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Comparison</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-800/40">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8 text-xs text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
              <span>Loading saved chats...</span>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-slate-500 space-y-2">
              <History className="w-6 h-6 mx-auto text-slate-600" />
              <p>No past comparisons yet.</p>
              <p className="text-[11px] text-slate-600">Your encrypted queries and verdicts will appear here.</p>
            </div>
          ) : (
            chatHistory.map((chat) => {
              const isActive = activeChatId === chat.id;
              const formattedDate = new Date(chat.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all ${
                    isActive
                      ? 'bg-sky-950/60 border border-sky-500/40 text-sky-200 shadow-sm'
                      : 'hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-medium truncate leading-snug">{chat.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-mono">
                      <Clock className="w-3 h-3 text-slate-600 shrink-0" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-all"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center bg-slate-950/30">
          <span>AES-256-GCM Encrypted Payloads</span>
        </div>
      </aside>`;

if (!code.includes('Comparison History')) {
  code = code.replace(
    '    <return (\n      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white flex flex-col justify-between w-full">' ,
    '    return (\n      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white flex flex-col justify-between w-full position-relative">' + '\n' + sidebarDrawer
  );

  code = code.replace(
    '  <return (\n    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white pb-16 w-full">',
    '  <return (\n    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection:text-white pb-16 w-full position-relative">' + '\n' + sidebarDrawer
  );
}

// 5. History Toggle buttons in both navbars
if (!code.includes('Open Comparison History')) {
  code = code.replace(
    '<div className="flex items-center gap-3">\n            <div className="w-9 h-9',
    '<div className="flex items-center gap-3">\n              <button\n                type="button"\n                onClick={() => setIsSidebarOpen(true)}\n                title="Open Comparison History"\n                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm",
              >\n                <PanelLeft className="w-4 h-4 text-sky-400" />\n                <span className="hidden sm:inline text-xs font-medium">History</span>\n              </button>\n            <div className="w-9 h-9'
  );

  code = code.replace(
    '<div className="flex items-center gap-3">\n              <div className="w-8 h-8 sm:w-9',
    '<div className="flex items-center gap-2">\n              <button\n                type="button"\n                onClick={() => setIsSidebarOpen(true)}\n                title="Open Comparison History"\n                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5 shadow-sm",
              >\n                <PanelLeft className="w-4 h-4 text-sky-400" />\n                <span className="hidden lg:inline text-xs font-medium">History</span>\n              </button>\n              <div className="w-8 h-8 sm:w-9'
  );
}

fs.writeFileSync('app/page.tsx', code, 'utf8');
console.log('Sidebar and navbars successfully applied!');
