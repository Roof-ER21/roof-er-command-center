export interface SavedSession {
  id: string;
  userId: string | number;
  startTime: string;
  endTime: string;
  targetLanguage: string;
  messages: any[];
}

export function saveTranslationSession(session: SavedSession) {
  const sessions = getTranslationSessions(session.userId);
  sessions.unshift(session);
  localStorage.setItem(`translation_sessions_${session.userId}`, JSON.stringify(sessions));
}

export function getTranslationSessions(userId: string | number): SavedSession[] {
  try {
    const stored = localStorage.getItem(`translation_sessions_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
