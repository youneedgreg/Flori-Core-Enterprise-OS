export interface ChatSession {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface ChatAttachment {
  type: string;
  name: string;
  data?: string; // base64 data
  url?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  createdAt: string;
}

const getHeaders = () => {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('access_token='))
    ?.split('=')[1];
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const getChatSessions = async (): Promise<ChatSession[]> => {
  const response = await fetch(`${API_URL}/chat/sessions`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
};

export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch messages');
  return response.json();
};

export const createChatSession = async (title: string): Promise<ChatSession> => {
  const response = await fetch(`${API_URL}/chat/sessions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Failed to create session');
  return response.json();
};

export const sendChatMessage = async (
  sessionId: string, 
  content: string,
  attachments?: ChatAttachment[]
): Promise<ChatMessage> => {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ content, attachments }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to send message');
  }
  return response.json();
};

export const executeChatAction = async (
  sessionId: string,
  actionType: string,
  payload: any
): Promise<any> => {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/action`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ actionType, payload }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to execute action');
  }
  return response.json();
};
