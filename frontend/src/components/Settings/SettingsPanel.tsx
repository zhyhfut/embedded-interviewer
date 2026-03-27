import { useState, useEffect } from 'react';

interface ConfigField {
  value: string;
  is_set: boolean;
  label: string;
  type: string;
  options?: string[];
  provider?: string;
}

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const [config, setConfig] = useState<Record<string, ConfigField>>({});
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeProvider, setActiveProvider] = useState('claude');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        setConfig(data.config || {});
        setLoaded(true);
        // 设置当前激活的 provider tab
        const provider = data.config?.LLM_PROVIDER?.value;
        if (provider) setActiveProvider(provider);
      })
      .catch(() => {
        setMessage('加载配置失败');
        setLoaded(true);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: edited }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setMessage('配置已保存！更改 API Key 后建议重启后端。');
        setEdited({});
        // 重新加载
        const reload = await fetch('/api/config');
        const reloadData = await reload.json();
        setConfig(reloadData.config || {});
      } else {
        setMessage('保存失败');
      }
    } catch {
      setMessage('保存失败：网络错误');
    }
    setSaving(false);
  };

  const handleChange = (key: string, value: string) => {
    setEdited((prev) => ({ ...prev, [key]: value }));
    if (key === 'LLM_PROVIDER') setActiveProvider(value);
  };

  const getValue = (key: string) => {
    if (key in edited) return edited[key];
    const field = config[key];
    if (!field) return '';
    if (field.type === 'password' && field.is_set) return ''; // 密码类不回显
    return field.value;
  };

  const providerGroups: Record<string, { label: string; icon: string; fields: string[] }> = {
    claude: { label: 'Claude', icon: '🧠', fields: ['ANTHROPIC_API_KEY', 'CLAUDE_MODEL'] },
    openai: { label: 'OpenAI', icon: '🟢', fields: ['OPENAI_API_KEY', 'OPENAI_MODEL'] },
    xiaomi: { label: '小米 MiMo', icon: '📱', fields: ['XIAOMI_API_KEY', 'XIAOMI_BASE_URL', 'XIAOMI_MODEL'] },
    doubao: { label: '豆包', icon: '🫘', fields: ['DOUBAO_API_KEY', 'DOUBAO_BASE_URL', 'DOUBAO_MODEL'] },
    custom: { label: '自定义', icon: '🔧', fields: ['CUSTOM_API_KEY', 'CUSTOM_BASE_URL', 'CUSTOM_MODEL'] },
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center flex-1">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">设置</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              配置 LLM API Key 和其他参数，修改后保存即可生效
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border)] rounded-lg text-sm transition-colors"
          >
            返回
          </button>
        </div>

        {/* 默认 Provider 选择 */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 mb-4 border border-[var(--border)]">
          <label className="block text-sm font-medium mb-3 text-[var(--text-secondary)]">
            默认 LLM Provider
          </label>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(providerGroups).map(([key, group]) => (
              <button
                key={key}
                onClick={() => handleChange('LLM_PROVIDER', key)}
                className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                  (edited['LLM_PROVIDER'] ?? config['LLM_PROVIDER']?.value) === key
                    ? 'bg-[var(--accent)] text-white ring-2 ring-[var(--accent)]/30'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {group.icon} {group.label}
                {config[`${key.toUpperCase()}_API_KEY`]?.is_set && (
                  <span className="block text-[10px] text-green-400 mt-0.5">已配置</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Provider 配置区（Tab 式） */}
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden mb-4">
          {/* Tab 头 */}
          <div className="flex border-b border-[var(--border)]">
            {Object.entries(providerGroups).map(([key, group]) => (
              <button
                key={key}
                onClick={() => setActiveProvider(key)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeProvider === key
                    ? 'bg-[var(--bg-tertiary)] text-white border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {group.icon} {group.label}
              </button>
            ))}
          </div>

          {/* Tab 内容 */}
          <div className="p-5 space-y-4 fade-in">
            {providerGroups[activeProvider]?.fields.map((key) => {
              const field = config[key];
              if (!field) return null;
              return (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5 text-[var(--text-secondary)]">
                    {field.label}
                    {field.type === 'password' && field.is_set && (
                      <span className="ml-2 text-xs text-green-400">✓ 已配置</span>
                    )}
                  </label>
                  {field.type === 'password' ? (
                    <input
                      type="password"
                      value={getValue(key)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={field.is_set ? '已配置（留空保持不变）' : '请输入...'}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  ) : field.options ? (
                    <select
                      value={getValue(key)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                    >
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={getValue(key)}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] transition-all"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 飞书配置 */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-5 border border-[var(--border)] mb-4">
          <h3 className="text-sm font-medium mb-3 text-[var(--text-secondary)]">
            飞书集成（可选）
          </h3>
          <div className="space-y-3">
            {['FEISHU_APP_ID', 'FEISHU_APP_SECRET'].map((key) => {
              const field = config[key];
              if (!field) return null;
              return (
                <div key={key}>
                  <label className="block text-xs mb-1 text-[var(--text-secondary)]">
                    {field.label}
                    {field.type === 'password' && field.is_set && (
                      <span className="ml-2 text-green-400">✓ 已配置</span>
                    )}
                  </label>
                  <input
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={getValue(key)}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={field.is_set ? '已配置（留空保持不变）' : '请输入...'}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg px-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)] transition-all"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 items-center">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(edited).length === 0}
            className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-xl font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? '保存中...' : '保存配置'}
          </button>
          {message && (
            <span className={`text-sm ${message.includes('成功') || message.includes('已保存') ? 'text-green-400' : 'text-yellow-400'}`}>
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
