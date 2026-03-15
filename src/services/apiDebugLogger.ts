export type ApiDebugLogEntry = {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  ok: boolean;
  durationMs: number;
  source: string;
  error?: string;
};

const STORAGE_KEY = 'prithvinet.api-debug.logs';
const MAX_LOGS = 400;
const CHANNEL_NAME = 'prithvinet-api-debug-channel';

let loggerInstalled = false;
let debugChannel: BroadcastChannel | null = null;

const getChannel = (): BroadcastChannel | null => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!debugChannel) {
    debugChannel = new BroadcastChannel(CHANNEL_NAME);
  }
  return debugChannel;
};

const parseStoredLogs = (): ApiDebugLogEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const isApiUrl = (rawUrl: string): boolean => {
  if (!rawUrl) return false;
  try {
    const target = new URL(rawUrl, window.location.origin);
    return target.pathname.startsWith('/api/') || target.port === '8000';
  } catch {
    return rawUrl.includes('/api/');
  }
};

const writeLog = (entry: ApiDebugLogEntry) => {
  if (typeof window === 'undefined') return;

  const next = [entry, ...parseStoredLogs()].slice(0, MAX_LOGS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Swallow quota/storage errors to avoid breaking app fetch calls.
  }

  const channel = getChannel();
  if (channel) {
    channel.postMessage(entry);
  }
};

export const getApiDebugLogs = (): ApiDebugLogEntry[] => parseStoredLogs();

export const clearApiDebugLogs = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const subscribeApiDebugLogs = (onLog: (entry: ApiDebugLogEntry) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue);
      if (Array.isArray(parsed) && parsed[0]) {
        onLog(parsed[0] as ApiDebugLogEntry);
      }
    } catch {
      // Ignore malformed localStorage payloads.
    }
  };

  window.addEventListener('storage', handleStorage);

  const channel = getChannel();
  const handleChannel = (event: MessageEvent<ApiDebugLogEntry>) => {
    if (event.data) {
      onLog(event.data);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleChannel as EventListener);
  }

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      channel.removeEventListener('message', handleChannel as EventListener);
    }
  };
};

export const installGlobalApiDebugLogging = (source: string = 'main-app') => {
  if (typeof window === 'undefined' || loggerInstalled) return;

  loggerInstalled = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.toString()
      : input.url;

    const shouldTrack = isApiUrl(url);
    const startedAt = performance.now();

    try {
      const response = await originalFetch(input, init);

      if (shouldTrack) {
        writeLog({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          method,
          url,
          status: response.status,
          ok: response.ok,
          durationMs: Math.round(performance.now() - startedAt),
          source,
        });
      }

      return response;
    } catch (error) {
      if (shouldTrack) {
        writeLog({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          method,
          url,
          status: 0,
          ok: false,
          durationMs: Math.round(performance.now() - startedAt),
          source,
          error: error instanceof Error ? error.message : 'Unknown fetch error',
        });
      }
      throw error;
    }
  };
};
