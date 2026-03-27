import { getReportDownloadUrl, exportToFeishu } from '../../api/client';
import { useState } from 'react';

interface Props {
  report: string;
  sessionId: string;
  onReset: () => void;
}

export default function ReportPanel({ report, sessionId, onReset }: Props) {
  const [feishuUrl, setFeishuUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportFeishu = async () => {
    setIsExporting(true);
    try {
      const url = await exportToFeishu(sessionId);
      setFeishuUrl(url);
    } catch (err) {
      alert(`导出到飞书失败: ${err}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* 操作栏 */}
        <div className="flex gap-3 mb-6 justify-end">
          <a
            href={getReportDownloadUrl(sessionId)}
            download
            className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-sm rounded-lg transition-colors"
          >
            下载 Markdown
          </a>
          <button
            onClick={handleExportFeishu}
            disabled={isExporting}
            className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] text-sm rounded-lg transition-colors disabled:opacity-50"
          >
            {isExporting ? '导出中...' : '导出到飞书'}
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-sm rounded-lg transition-colors"
          >
            重新面试
          </button>
        </div>

        {feishuUrl && (
          <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm">
            飞书文档已创建：
            <a
              href={feishuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline ml-1"
            >
              {feishuUrl}
            </a>
          </div>
        )}

        {/* 报告内容 */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 border border-[var(--border)]">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-[inherit] bg-transparent p-0 m-0">
              {report}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
