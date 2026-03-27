import { useState } from 'react'
import './index.css'
import SetupPanel from './components/Setup/SetupPanel'
import ChatWindow from './components/Chat/ChatWindow'
import ReportPanel from './components/Report/ReportPanel'
import SettingsPanel from './components/Settings/SettingsPanel'
import HistoryPanel from './components/History/HistoryPanel'
import HistoryDetail from './components/History/HistoryDetail'
import { useInterview } from './hooks/useInterview'

type View = 'setup' | 'chat' | 'report' | 'settings' | 'history' | 'history-detail';

function App() {
  const [view, setView] = useState<View>('setup');
  const [historySessionId, setHistorySessionId] = useState<string | null>(null);
  const {
    messages,
    sessionId,
    isLoading,
    isFinished,
    report,
    isGeneratingReport,
    startInterview,
    sendMessage,
    generateReport,
    resetInterview,
  } = useInterview()

  const handleReset = () => {
    resetInterview();
    setView('setup');
  };

  const handleStart = async (...args: Parameters<typeof startInterview>) => {
    await startInterview(...args);
    setView('chat');
  };

  const handleHistorySelect = (sid: string) => {
    setHistorySessionId(sid);
    setView('history-detail');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-6 py-3 flex items-center justify-between bg-[var(--bg-secondary)]/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold shadow-lg">
            E
          </div>
          <h1 className="text-lg font-semibold">嵌入式面试模拟</h1>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'setup' && view !== 'settings' && view !== 'history' && view !== 'history-detail' && (
            <button
              onClick={handleReset}
              className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-tertiary)]"
            >
              新建面试
            </button>
          )}
          {/* 历史按钮 */}
          <button
            onClick={() => setView(view === 'history' || view === 'history-detail' ? 'setup' : 'history')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              view === 'history' || view === 'history-detail'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            历史
          </button>
          {/* 设置按钮 */}
          <button
            onClick={() => setView(view === 'settings' ? 'setup' : 'settings')}
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              view === 'settings'
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置
          </button>
        </div>
      </header>

      {/* Main content */}
      {view === 'settings' ? (
        <SettingsPanel onClose={() => setView('setup')} />
      ) : view === 'history' ? (
        <HistoryPanel onSelect={handleHistorySelect} onClose={() => setView('setup')} />
      ) : view === 'history-detail' && historySessionId ? (
        <HistoryDetail sessionId={historySessionId} onBack={() => setView('history')} />
      ) : view === 'setup' ? (
        <SetupPanel onStart={handleStart} isLoading={isLoading} />
      ) : report ? (
        <ReportPanel report={report} sessionId={sessionId!} onReset={handleReset} />
      ) : (
        <ChatWindow
          messages={messages}
          onSend={sendMessage}
          isLoading={isLoading}
          isFinished={isFinished}
          onGenerateReport={generateReport}
          isGeneratingReport={isGeneratingReport}
          onReset={handleReset}
        />
      )}
    </div>
  )
}

export default App
