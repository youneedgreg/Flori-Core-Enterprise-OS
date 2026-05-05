export interface ChatSession {
  id: string;
  title: string | null;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
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

export const sendChatMessage = async (sessionId: string, content: string): Promise<ChatMessage> => {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to send message');
  }
  return response.json();
};
