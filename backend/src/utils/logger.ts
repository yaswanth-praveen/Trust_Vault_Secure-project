export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  warn: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error);
    }
  },
};
