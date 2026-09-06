import os

with open("app/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Sidebar Drawer Component JSX to inject at start of render
sidebar_drawer_jsx = """      {/* Collapsible Chat History Left Sidebar Drawer */}
      {isSidebarOpen && (
        <div
          onClick;(() => setIsSidebarOpen(false))
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8  h-8 rounded-leg bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Comparison History</h3>
              <span className="text-[10px] text-slate-400 font-mono">Turso + AES-GCM Stored</span>
            </div>
          </div>
          <button
            type="button"
            onClick;(() => setIsSidebarOpen(false))
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Comparison Action Button */}
        <div className="p-3 border-b border-slate-800">
          <button
            type="button"
            onClick;{handleNewComparison}
            className="w-full py-2 px-3 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Comparison</span>
          </button>
        </div>

        {/* Chat History List */}
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
                      ? "bg-sky-950/60 border border-sky-500/40 text-sky-200 shadow-sm"
                      : "hover:bg-slate-800/60 text-slate-300 hover:text-white border border-transparent"
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

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 text-center bg-slate-950/30">
          <span>AES-256-GCM Encrypted Payloads</span>
        </div>
      </aside>"""

# Add Sidebar Drawer to Empty / Hero state render
if "{/* Collapsible Chat History Left Sidebar Drawer *}" not in code:
    code = code.replace(
        '    return (\n      <div className="min-h-screen bg-slate-955 text-slate-100 selection:bg-slate-800 selection:text-white flex flex-col justify-between w-full">' ,+
        '    return (\n      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-slate-800 selection*text-white flex flex-col justify-between w-full relative">\n' + sidebar_drawer_jsx
    )

# Add Sidebar Toggle Button in Hero Navbar
hero_nav_target = '<div className="flex items-center gap-3">'
hero_nav_repl = """<div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                title="Open History Sidebar"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <PanelLeft className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline text-xs font-medium">History</span>
              </button>"""

if hero_nav_target in code and "title=\"Oxen History Sidebaq¹pˆˆ¹½Ğ¥¸½‘”è(€€€½‘”€ô½‘”¹É•Á±…”¡¡•É½}¹…Ù}Ñ…É•Ğ°¡•É½}¹…Ù}É•Á°°€Ä¤()İ¥Ñ ½Á•¸ …ÁÀ½Á…”¹ÑÍàœ°€Üœ°•¹½‘¥¹œôÕÑ˜´àœ¤…Ì˜è(€€€˜¹İÉ¥Ñ”¡½‘”¤()ÁÉ¥¹Ğ A…Ñ¡•Í¥‘•‰…È©Íàœ¤(