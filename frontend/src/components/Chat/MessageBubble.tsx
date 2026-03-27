import type { Message } from '../../types';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const isInterviewer = message.role === 'interviewer';
  const isEmpty = !message.content;
  const showCursor = isStreaming && message.content.length > 0;

  return (
    <div className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'} bubble-in`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isInterviewer
            ? 'bg-[var(--interviewer-bg)] rounded-bl-md'
            : 'bg-[var(--candidate-bg)] rounded-br-md'
        }`}
      >
        <div className="text-xs font-medium mb-1.5 opacity-60 flex items-center gap-1.5">
          {isInterviewer && (
            <span className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px]">
              AI
            </span>
          )}
          {isInterviewer ? '面试官' : '你'}
        </div>

        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${showCursor ? 'streaming-cursor' : ''}`}>
          {isEmpty ? (
            <ThinkingIndicator />
          ) : (
            message.content
          )}
        </div>
      </div>
    </div>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" />
        <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:0.15s]" />
        <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce [animation-delay:0.3s]" />
      </div>
      <span className="text-xs text-white/40">面试官正在思考</span>
    </div>
  );
}
