import { useState, useEffect } from 'react';
import { getApiBase } from '../../api/client';

interface HistoryItem {
  session_id: string;
  direction: string;
  difficulty: string;
  question_count: number;
  topics_covered: string[];
  created_at: string;
  is_finished: boolean;
  has_report: boolean;
  message_count: number;
  preview: string;
}

interface Props {
  onSelect: (sessionId: string) => void;
  onClose: () => void;
}

export default function HistoryPanel({ onSelect, onClose }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/interview/history`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.sessions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('确定删除这条面试记录？')) return;
    await fetch(`${getApiBase()}/interview/history/${sessionId}`, { method: 'DELETE' });
    setHistory((prev) => prev.filter((s) => s.session_id !== sessionId));
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return '昨天 ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diffDays < 7) return `${diffDays}天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const directionLabel = (d: string) => d === 'embedded' ? '嵌入式' : '具身智能';
  const directionIcon = (d: string) => d === 'embedded' ? '⚙️' : '🤖';

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 safe-area-bottom">
      <div className="max-w-3xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">面试历史</h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              {history.length > 0 ? `共 ${history.length} 条记录` : '暂无历史记录'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] rounded-lg text-xs sm:text-sm transition-colors"
          >
            返回
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            <div className="text-4xl mb-3">📋</div>
            <p>还没有面试记录</p>
            <p className="text-sm mt-1 opacity-60">完成一次面试后，记录会自动保存在这里</p>
          </div>
        ) : (
          <div className="space-y-2.5 sm:space-y-3 fade-in">
            {history.map((item) => (
              <div
                key={item.session_id}
                onClick={() => onSelect(item.session_id)}
                className="bg-[var(--bg-secondary)] rounded-xl p-3 sm:p-4 border border-[var(--border)] hover:border-[var(--accent)]/50 cursor-pointer transition-all hover:bg-[var(--bg-secondary)]/80 group active:bg-[var(--bg-tertiary)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* 头部：方向 + 难度 + 日期 */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                      <span className="text-base">{directionIcon(item.direction)}</span>
                      <span className="text-sm font-medium">{directionLabel(item.direction)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.difficulty === 'SSP' ? 'bg-purple-500/20 text-purple-300' :
                        item.difficulty === 'SP' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {item.difficulty}
                      </span>
                      {item.has_report && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                          已报告
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)] ml-auto shrink-0">
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    {/* 预览 */}
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate">
                      {item.preview}
                    </p>

                    {/* 底部统计 */}
                    <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs text-[var(--text-secondary)]/70">
                      <span>{item.question_count} 题</span>
                      <span>{item.topics_covered.length} 领域</span>
                      <span>{item.message_count} 对话</span>
                    </div>
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => handleDelete(item.session_id, e)}
                    className="opacity-0 group-hover:opacity-100 ml-2 sm:ml-3 p-1.5 rounded-lg hover:bg-red-500/20 text-[var(--text-secondary)] hover:text-red-400 transition-all"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
