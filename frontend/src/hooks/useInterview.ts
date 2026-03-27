import { useState, useCallback } from 'react';
import type { Message } from '../types';
import * as api from '../api/client';

export function useInterview() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isSetup, setIsSetup] = useState(true);
  const [report, setReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const startInterview = useCallback(
    async (
      config: {
        resumeText?: string;
        feishuLink?: string;
        difficulty?: string;
        model?: string;
      },
      resumeFile?: File,
    ) => {
      setIsLoading(true);
      setIsSetup(false);
      setMessages([]);

      // 添加一个空的面试官消息，用于流式填充
      setMessages([{ role: 'interviewer', content: '' }]);

      try {
        const { sessionId: sid } = await api.startInterview(
          config,
          resumeFile,
          (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'interviewer') {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + chunk,
                };
              }
              return updated;
            });
          },
        );
        setSessionId(sid);
      } catch (err) {
        setMessages([{ role: 'interviewer', content: `启动失败: ${err}` }]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || isLoading) return;

      // 添加候选人消息
      setMessages((prev) => [...prev, { role: 'candidate', content }]);
      setIsLoading(true);

      // 添加空面试官消息用于流式填充
      setMessages((prev) => [...prev, { role: 'interviewer', content: '' }]);

      try {
        const { isFinished: finished } = await api.sendAnswer(
          sessionId,
          content,
          (chunk) => {
            setMessages((prev) => {
              const updated = [...prev];
              if (updated.length > 0 && updated[updated.length - 1].role === 'interviewer') {
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + chunk,
                };
              }
              return updated;
            });
          },
        );
        if (finished) {
          setIsFinished(true);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: 'interviewer', content: `发送失败: ${err}` },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, isLoading],
  );

  const generateReport = useCallback(async () => {
    if (!sessionId) return;
    setIsGeneratingReport(true);
    try {
      const reportContent = await api.generateReport(sessionId);
      setReport(reportContent);
    } catch (err) {
      setReport(`报告生成失败: ${err}`);
    } finally {
      setIsGeneratingReport(false);
    }
  }, [sessionId]);

  const resetInterview = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setIsLoading(false);
    setIsFinished(false);
    setIsSetup(true);
    setReport(null);
  }, []);

  return {
    messages,
    sessionId,
    isLoading,
    isFinished,
    isSetup,
    report,
    isGeneratingReport,
    startInterview,
    sendMessage,
    generateReport,
    resetInterview,
  };
}
