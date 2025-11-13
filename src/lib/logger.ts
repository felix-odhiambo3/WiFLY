// A simple in-memory logger for demonstration purposes.
// In a production environment, you would use a more robust logging service
// like Winston, Pino, or a cloud-based logging platform.

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'ADMIN';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  reference?: string; // e.g., MAC address, transaction ID
}

// In-memory store for logs.
const logs: LogEntry[] = [];

/**
 * Adds a new entry to the log store.
 */
export function addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
  const newLog: LogEntry = {
    ...entry,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  // Add to the beginning of the array so newest logs are first
  logs.unshift(newLog);

  // Optional: Keep the log array from growing indefinitely
  if (logs.length > 200) {
    logs.pop();
  }
}

/**
 * Retrieves all log entries.
 */
export function getLogs(): LogEntry[] {
  return logs;
}

// Initialize with a welcome log
if (logs.length === 0) {
    addLog({
        level: 'INFO',
        source: 'System',
        message: 'Logging service initialized.',
    });
}
