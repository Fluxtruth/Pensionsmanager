type SyncEvent = "sync-started" | "sync-completed" | "sync-failed";

type SyncCallback = (data?: any) => void;

class SyncEventEmitter {
  private listeners: Record<string, SyncCallback[]> = {};

  public on(event: SyncEvent, callback: SyncCallback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off(event: SyncEvent, callback: SyncCallback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
  }

  public emit(event: SyncEvent, data?: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((cb) => cb(data));
  }
}

export const syncEvents = new SyncEventEmitter();
