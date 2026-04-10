import { useState, useEffect } from 'react';
import type { Message } from '../../types';
import { getApiBase } from '../../api/client';

interface HistoryData {
  session_id: string;
  direction: string;
  difficulty: string;
  question_count: number;
  topics_covered: string[];
  created_at: string;
  is_finished: boolean;
  resume_text: string;
  report_content: string;
  messages: Message[];
}

interface Props {
  sessionId: string;
  onBack: () => void;
}

export default function HistoryDetail({ sessionId, onBack }: Props) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    fetch(`${getApiBase()}/interview/history/${sessionId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const directionLabel = (d: string) => d === 'embedded' ? '嵌入式' : '具身智能';

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3">
        <p className="text-[var(--text-secondary)]">加载失败</p>
        <button onClick={onBack} className="text-sm text-[var(--accent)] hover:underline">返回</button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* 顶部信息栏 */}
      <div className="sticky top-0 z-10 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border)] px-3 sm:px-6 py-3 sm:py-4 safe-area-top">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="text-xs sm:text-sm font-medium">
                {directionLabel(data.direction)} · {data.difficulty} · {data.question_count} 题
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                {formatDate(data.created_at)}
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={() => setShowReport(!showReport)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showReport
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
              }`}
              disabled={!data.report_content}
            >
              {data.report_content ? (showReport ? '对话' : '报告') : '无报告'}
            </button>
            {data.report_content && (
              <a
                href={`${getApiBase()}/report/export-file/${sessionId}`}
                download
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white transition-colors"
              >
                下载
              </a>
            )}
          </div>
        </div>

        {/* 领域标签 */}
        {data.topics_covered.length > 0 && (
          <div className="max-w-4xl mx-auto mt-2 flex gap-1.5 flex-wrap">
            {data.topics_covered.map((t) => (
              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 内容区 */}
      <div className="max-w-4xl mx-auto p-3 sm:p-6 safe-area-bottom">
        {showReport && data.report_content ? (
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 sm:p-6 border border-[var(--border)] fade-in">
            <pre className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed font-[inherit] bg-transparent p-0 m-0">
              {data.report_content}
            </pre>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 fade-in">
            {data.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
                    msg.role === 'interviewer'
                      ? 'bg-[var(--interviewer-bg)] rounded-bl-md'
                      : 'bg-[var(--candidate-bg)] rounded-br-md'
                  }`}
                >
                  <div className="text-xs font-medium mb-1 sm:mb-1.5 opacity-60 flex items-center gap-1.5">
                    {msg.role === 'interviewer' && (
                      <span className="w-5 h-5 rounded-full bg-blue-600/30 flex items-center justify-center text-[10px]">
                        AI
                      </span>
                    )}
                    {msg.role === 'interviewer' ? '面试官' : '你'}
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
