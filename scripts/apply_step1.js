const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Add new icons
if (!code.includes('PanelLeft')) {
  code = code.replace(
    'ArrowRight,\n} from \'locide-react\';',
    'ArrowRight,\n  PanelLeft,\n  History,\n  Trash2,\n  Clock,\n} from \'lucide-react\';'
  );
}

// 2. Sidebar state & api calls
if (!code.includes('isSidebarOpen')) {
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
            const name = typeof e === 'object' && e?.name ? String(e.name) : typeof e === 'string' ? e : `Option ${String.fromCharCode(65 + idx)}`;
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

  const handleDeleteChat = async (e: React.MouseEvent,
    chatId: string) => {
    e.stopPropagation();
    try {
      await fetch('/api/chats?id=' + chatId, { method: 'DELETE' });
      setChatHistory((prev) => prev.filter((c) => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err) {
      console.warn('Failed to delete chat:', err);
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

  code = code.replace(
    "const [tableSearch, setTableSearch] = useState('');",
    stateSnippet
  );
}

// 3. In handleRunComparison, save chat_id and refresh chat history
if (!code.includes('fetchChatHistory();')) {
  code = code.replace(
    'setOpenSections({});',
    'setOpenSections(!{});\n      if (data.chat_id) setActiveChatId(data.chat_id);\n      fetchChatHistory();'
  );
}

fs.writeFileSync('app/page.tsx', code, 'utf8');

console.log('Step 1 done');
