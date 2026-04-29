import { io, Socket } from "socket.io-client";

class CollabService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;

  connect() {
    if (this.socket) return;
    this.socket = io(window.location.origin);
    
    this.socket.on("connect", () => {
      console.log("Connected to collaboration server");
    });
  }

  joinSession(sessionId: string, userId: string, username: string) {
    this.sessionId = sessionId;
    this.socket?.emit("join-session", { sessionId, userId, username });
  }

  sendCodeUpdate(code: any, language?: string) {
    if (!this.sessionId) return;
    this.socket?.emit("code-update", { sessionId: this.sessionId, code, language });
  }

  sendCursorUpdate(userId: string, position: any) {
    if (!this.sessionId) return;
    this.socket?.emit("cursor-update", { sessionId: this.sessionId, userId, position });
  }

  sendTyping(userId: string, username: string) {
    if (!this.sessionId) return;
    this.socket?.emit("typing", { sessionId: this.sessionId, userId, username });
  }

  onCodeSync(callback: (data: { code: any, language: string }) => void) {
    this.socket?.on("code-sync", callback);
  }

  onSessionState(callback: (data: { code: any, language: string, users: string[] }) => void) {
    this.socket?.on("session-state", callback);
  }

  onUserJoined(callback: (data: { userId: string, username: string }) => void) {
    this.socket?.on("user-joined", callback);
  }

  onUserLeft(callback: (userId: string) => void) {
    this.socket?.on("user-left", callback);
  }

  onUserTyping(callback: (data: { userId: string, username: string }) => void) {
    this.socket?.on("user-typing", callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.sessionId = null;
  }
}

export const collabService = new CollabService();
