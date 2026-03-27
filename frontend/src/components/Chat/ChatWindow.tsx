import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../types';
import MessageBubble from './MessageBubble';

interface Props {
  messages: Message[];
  onSend: (content: string) => void;
  isLoading: boolean;
  isFinished: boolean;
  onGenerateReport: () => void;
  isGeneratingReport: boolean;
  onReset: () => void;
}

export default function ChatWindow({
  messages,
  onSend,
  isLoading,
  isFinished,
  onGenerateReport,
  isGeneratingReport,
  onReset,
}: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput('');
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 判断最后一条消息是否正在流式输出
  const isLastStreaming =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'interviewer' &&
    messages[messages.length - 1].content.length > 0;

  // 面试官正在生成但还没开始输出（显示思考状态）
  const isThinking =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'interviewer' &&
    messages[messages.length - 1].content.length === 0;

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            isStreaming={isLastStreaming && idx === messages.length - 1}
          />
        ))}

        {/* 独立的思考指示器（当最后一条是空的面试官消息时显示更漂亮的版本） */}
        {isThinking && (
          <div className="flex justify-start bubble-in">
            <div className="bg-[var(--interviewer-bg)] rounded-2xl rounded-bl-md px-5 py-4 max-w-[200px]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce [animation-delay:0.3s]" />
                </div>
                <span className="text-xs text-blue-300/60 thinking-dots">面试官正在思考</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-[var(--border)] p-4 bg-[var(--bg-primary)]">
        {isFinished ? (
          <div className="flex gap-3 justify-center fade-in">
            <button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isGeneratingReport && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isGeneratingReport ? '生成中...' : '生成面试报告'}
            </button>
            <button
              onClick={onReset}
              className="px-6 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors"
            >
              重新面试
            </button>
          </div>
        ) : (
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的回答... (Shift+Enter 换行)"
                rows={1}
                disabled={isLoading}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50 transition-all"
                style={{ minHeight: '44px', maxHeight: '150px' }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  思考中
                </>
              ) : (
                <>
                  发送
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
