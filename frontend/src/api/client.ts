// 检测是否运行在 Capacitor 原生环境中
function isCapacitor(): boolean {
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

// 设置后端地址（供设置页面使用）
export function setBackendUrl(url: string) {
  localStorage.setItem('backend_url', url.replace(/\/$/, '') + '/api');
}

// 获取当前 API 基础路径（包含 /api 后缀）
// 在 Capacitor 中：使用用户配置的后端地址（默认 localhost:8000）
// 在浏览器中：使用相对路径 /api
export function getApiBase(): string {
  if (isCapacitor()) {
    const stored = localStorage.getItem('backend_url');
    return stored || 'http://localhost:8000/api';
  }
  return '/api';
}

export async function startInterview(
  config: {
    resumeText?: string;
    feishuLink?: string;
    difficulty?: string;
    model?: string;
    direction?: string;
    pressure?: boolean;
  },
  resumeFile?: File,
  onChunk?: (content: string) => void,
): Promise<{ sessionId: string }> {
  const formData = new FormData();

  if (resumeFile) {
    formData.append('resume_file', resumeFile);
  }
  if (config.resumeText) {
    formData.append('resume_text', config.resumeText);
  }
  if (config.feishuLink) {
    formData.append('feishu_link', config.feishuLink);
  }
  if (config.difficulty) {
    formData.append('difficulty', config.difficulty);
  }
  if (config.model) {
    formData.append('model', config.model);
  }
  if (config.direction) {
    formData.append('direction', config.direction);
  }
  if (config.pressure) {
    formData.append('pressure', 'true');
  }

  const response = await fetch(`${getApiBase()}/interview/start`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`启动面试失败: ${response.status}`);
  }

  let sessionId = '';
  await readSSEStream(response, (data) => {
    if (data.content && onChunk) {
      onChunk(data.content);
    }
    if (data.done) {
      sessionId = data.session_id;
    }
  });

  return { sessionId };
}

export async function sendAnswer(
  sessionId: string,
  message: string,
  onChunk?: (content: string) => void,
): Promise<{ isFinished: boolean }> {
  const response = await fetch(`${getApiBase()}/interview/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!response.ok) {
    throw new Error(`发送失败: ${response.status}`);
  }

  let isFinished = false;
  await readSSEStream(response, (data) => {
    if (data.content && onChunk) {
      onChunk(data.content);
    }
    if (data.done) {
      isFinished = data.is_finished || false;
    }
  });

  return { isFinished };
}

export async function endInterview(sessionId: string) {
  const response = await fetch(`${getApiBase()}/interview/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  return response.json();
}

export async function generateReport(sessionId: string): Promise<string> {
  const response = await fetch(`${getApiBase()}/report/generate/${sessionId}`, {
    method: 'POST',
  });
  const data = await response.json();
  return data.report;
}

export async function getSessionInfo(sessionId: string) {
  const response = await fetch(`${getApiBase()}/interview/sessions/${sessionId}`);
  return response.json();
}

export function getReportDownloadUrl(sessionId: string): string {
  return `${getApiBase()}/report/export-file/${sessionId}?format=markdown`;
}

export async function exportToFeishu(sessionId: string): Promise<string> {
  const response = await fetch(`${getApiBase()}/report/export-feishu`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  const data = await response.json();
  return data.feishu_url;
}

async function readSSEStream(
  response: Response,
  onData: (data: any) => void,
) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) return;

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          onData(data);
        } catch {
          // ignore parse errors
        }
      }
    }
  }
}
