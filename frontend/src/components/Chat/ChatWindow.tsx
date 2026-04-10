import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message } from '../../types';
import MessageBubble from './MessageBubble';

// Web Speech API 类型声明
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

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
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported] = useState(() => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  // 移动端：键盘弹出时滚动到底部
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    };

    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

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

  // 语音识别
  const toggleRecording = useCallback(() => {
    if (!speechSupported) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';

    let finalTranscript = input;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim += transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [isRecording, speechSupported, input]);

  const isLastStreaming =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'interviewer' &&
    messages[messages.length - 1].content.length > 0;

  const isThinking =
    isLoading &&
    messages.length > 0 &&
    messages[messages.length - 1].role === 'interviewer' &&
    messages[messages.length - 1].content.length === 0;

  return (
    <div className="flex flex-col flex-1 max-w-4xl mx-auto w-full">
      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            isStreaming={isLastStreaming && idx === messages.length - 1}
          />
        ))}

        {isThinking && (
          <div className="flex justify-start bubble-in">
            <div className="bg-[var(--interviewer-bg)] rounded-2xl rounded-bl-md px-4 sm:px-5 py-3 sm:py-4 max-w-[200px]">
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
      <div className="border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--bg-primary)] safe-area-bottom chat-input-area">
        {isFinished ? (
          <div className="flex gap-2 sm:gap-3 justify-center fade-in flex-wrap">
            <button
              onClick={onGenerateReport}
              disabled={isGeneratingReport}
              className="px-5 sm:px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg font-medium transition-all disabled:opacity-50 flex items-center gap-2"
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
              className="px-5 sm:px-6 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium transition-colors"
            >
              重新面试
            </button>
          </div>
        ) : (
          <div className="flex gap-2 sm:gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "正在录音...点击麦克风停止" : "输入你的回答..."}
                rows={1}
                disabled={isLoading}
                className={`w-full bg-[var(--bg-tertiary)] border rounded-xl px-4 py-3 pr-12 text-base text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/30 disabled:opacity-50 transition-all ${
                  isRecording ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border)] focus:border-[var(--accent)]'
                }`}
                style={{ minHeight: '44px', maxHeight: '150px' }}
              />
              {/* 语音输入按钮 */}
              {speechSupported && (
                <button
                  onClick={toggleRecording}
                  disabled={isLoading}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                  }`}
                  title={isRecording ? "停止录音" : "语音输入"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-4 sm:px-5 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  <span className="hidden sm:inline">发送</span>
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
