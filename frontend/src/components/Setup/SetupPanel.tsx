import { useState, useRef, useEffect, useCallback } from 'react';
import { getApiBase } from '../../api/client';

interface Props {
  onStart: (
    config: {
      resumeText?: string;
      feishuLink?: string;
      difficulty?: string;
      model?: string;
      direction?: string;
      pressure?: boolean;
    },
    file?: File,
  ) => void;
  isLoading: boolean;
}

interface Provider {
  id: string;
  name: string;
}

export default function SetupPanel({ onStart, isLoading }: Props) {
  const [direction, setDirection] = useState('embedded');
  const [pressure, setPressure] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [feishuLink, setFeishuLink] = useState('');
  const [difficulty, setDifficulty] = useState('SP');
  const [model, setModel] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'feishu' | 'none'>('text');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${getApiBase()}/interview/providers`)
      .then((r) => r.json())
      .then((data) => {
        const available = data.providers || [];
        setProviders(available);
        if (available.length > 0 && !model) {
          setModel(available[0].id);
        }
      })
      .catch(() => {
        setProviders([
          { id: 'claude', name: 'Claude (Anthropic)' },
          { id: 'openai', name: 'OpenAI (GPT-4o)' },
        ]);
        if (!model) setModel('claude');
      });
  }, []);

  const handleStart = () => {
    const config: any = { difficulty, model, direction, pressure };
    if (inputMode === 'text' && resumeText.trim()) {
      config.resumeText = resumeText.trim();
    } else if (inputMode === 'feishu' && feishuLink.trim()) {
      config.feishuLink = feishuLink.trim();
    }
    onStart(config, inputMode === 'file' && selectedFile ? selectedFile : undefined);
  };

  // 拖拽文件处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'pdf' || ext === 'docx' || ext === 'doc') {
        setSelectedFile(file);
        setInputMode('file');
      } else {
        alert('请拖入 PDF 或 DOCX 格式的文件');
      }
    }
  }, []);

  return (
    <div className="flex items-center justify-center flex-1 p-3 sm:p-6 safe-area-bottom">
      <div className="w-full max-w-2xl bg-[var(--bg-secondary)] rounded-2xl p-5 sm:p-8 shadow-2xl border border-[var(--border)] fade-in">
        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 text-center">嵌入式面试模拟</h2>
        <p className="text-[var(--text-secondary)] text-center mb-6 sm:mb-8 text-xs sm:text-sm">
          模拟大疆、华为、乐鑫、小鹏等公司嵌入式与具身智能岗位面试
        </p>

        {/* 面试方向 */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            面试方向
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'embedded', label: '嵌入式', desc: 'Linux驱动 / RTOS / 系统架构', icon: '⚙️' },
              { key: 'embodied', label: '具身智能', desc: 'ROS / SLAM / 运动控制', icon: '🤖' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDirection(opt.key)}
                className={`py-3 px-3 rounded-xl text-sm font-medium transition-all ${
                  direction === opt.key
                    ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--border)]'
                }`}
              >
                <span className="text-base mr-1">{opt.icon}</span> {opt.label}
                <span className="block text-xs mt-0.5 opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 简历输入方式 */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            简历输入方式
          </label>
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {[
              { key: 'text', label: '粘贴文本' },
              { key: 'file', label: '上传文件' },
              { key: 'feishu', label: '飞书链接' },
              { key: 'none', label: '不提供' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setInputMode(opt.key as any)}
                className={`py-2 px-2 sm:px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  inputMode === opt.key
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 简历输入区域 */}
        {inputMode === 'text' && (
          <div className="mb-5 sm:mb-6 fade-in">
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              粘贴简历内容
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="将简历内容粘贴到这里..."
              className="w-full h-32 sm:h-40 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] resize-none focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all"
            />
          </div>
        )}

        {inputMode === 'file' && (
          <div className="mb-5 sm:mb-6 fade-in">
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              上传简历文件（PDF / DOCX）
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full h-28 sm:h-36 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-[var(--accent)] bg-blue-500/10 scale-[1.01]'
                  : selectedFile
                    ? 'border-[var(--success)]/50 bg-green-500/5'
                    : 'border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {selectedFile ? (
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2">📄</div>
                  <div className="text-sm font-medium">{selectedFile.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB · 点击更换
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2 opacity-50">📂</div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    点击选择文件
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1 opacity-60">
                    支持 PDF、DOCX 格式
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setSelectedFile(f);
              }}
              className="hidden"
            />
          </div>
        )}

        {inputMode === 'feishu' && (
          <div className="mb-5 sm:mb-6 fade-in">
            <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
              飞书云文档链接
            </label>
            <input
              type="text"
              value={feishuLink}
              onChange={(e) => setFeishuLink(e.target.value)}
              placeholder="https://xxx.feishu.cn/wiki/..."
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 transition-all"
            />
          </div>
        )}

        {/* 面试档位 */}
        <div className="mb-5 sm:mb-6">
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            面试档位
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: '白菜', desc: '基础岗', color: 'text-green-400' },
              { key: 'SP', desc: '核心研发', color: 'text-blue-400' },
              { key: 'SSP', desc: '高级/架构', color: 'text-purple-400' },
            ].map((d) => (
              <button
                key={d.key}
                onClick={() => setDifficulty(d.key)}
                className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                  difficulty === d.key
                    ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {d.key}
                <span className={`block text-xs mt-0.5 ${difficulty === d.key ? 'opacity-80' : 'opacity-50'}`}>
                  {d.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 模型选择 */}
        <div className="mb-6 sm:mb-8">
          <label className="block text-sm font-medium mb-2 text-[var(--text-secondary)]">
            LLM 模型
          </label>
          {providers.length === 0 ? (
            <p className="text-sm text-yellow-400 bg-yellow-900/30 rounded-xl p-3">
              未检测到已配置的 API Key，请在设置中配置至少一个 LLM provider
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setModel(p.id)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                    model === p.id
                      ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/30'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 压力面模式 */}
        <div className="mb-5 sm:mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => setPressure(!pressure)}
              className={`w-10 h-6 rounded-full transition-colors relative ${
                pressure ? 'bg-red-500' : 'bg-[var(--bg-tertiary)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  pressure ? 'translate-x-4.5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <div>
              <span className="text-sm font-medium">压力面模式</span>
              <span className="text-xs text-[var(--text-secondary)] ml-2">
                更激进的追问，像大疆/华为终面一样
              </span>
            </div>
          </label>
        </div>

        {/* 开始按钮 */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>正在连接面试官</span>
              <span className="thinking-dots" />
            </>
          ) : (
            '开始面试'
          )}
        </button>

        {/* 进度条 */}
        {isLoading && (
          <div className="mt-3 h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div className="h-full bg-[var(--accent)] rounded-full progress-animate" />
          </div>
        )}
      </div>
    </div>
  );
}
