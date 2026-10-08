enum LogLevel {
  debug = 0,
  info,
  warn,
  error,
};

type LogLevels = keyof typeof LogLevel;

type LoggingFunction = (message: unknown, ...data: unknown[]) => void;
interface Logger {
  debug: LoggingFunction;
  info: LoggingFunction;
  warn: LoggingFunction;
  error: LoggingFunction;
}

let globalLogLevel: LogLevel;

const setLogLevel = (level: LogLevels) => globalLogLevel = LogLevel[level] ?? LogLevel.info;

class ConsoleLogger implements Logger {
  constructor(private name: string) { }

  public debug(message: unknown, ...data: unknown[]): void {
    this.log(LogLevel.debug, message, ...data);
  }

  public info(message: unknown, ...data: unknown[]): void {
    this.log(LogLevel.info, message, ...data);
  }

  public warn(message: unknown, ...data: unknown[]): void {
    this.log(LogLevel.warn, message, ...data);
  }

  public error(message: unknown, ...data: unknown[]): void {
    this.log(LogLevel.error, message, ...data);
  }

  protected log(level: LogLevel, message: unknown, ...data: unknown[]): void {
    if (level < globalLogLevel) {
      return;
    }

    const messageWithName = `[${this.name}] ${message}`;

    switch (level) {
      case LogLevel.debug:
        // eslint-disable-next-line no-console
        console.debug(messageWithName, ...data);
        break;
      case LogLevel.info:
        // eslint-disable-next-line no-console
        console.info(messageWithName, ...data);
        break;
      case LogLevel.warn:
        console.warn(messageWithName, ...data);
        break;
      case LogLevel.error:
        console.error(messageWithName, ...data);
        break;
    }
  }
}

setLogLevel((import.meta.env.VITE_LOG_LEVEL) as LogLevels);
(window as unknown as { __setLogLevel: typeof setLogLevel }).__setLogLevel = setLogLevel;

export function createLogger(name: string): Logger {
  return new ConsoleLogger(name);
}
