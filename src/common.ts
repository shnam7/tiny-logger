import type { LevelWithSilent, SerializedError } from "pino";
import type { Logger as BaseLogger } from "ts-log";

export type { SerializedError };

export interface LogObject {
  level: number;
  time: number;
  pid: number | string;
  hostname: string;
  msg?: unknown;
  prefix?: string;
  err?: SerializedError;
  [key: string]: unknown;
}

export interface FormatHooks {
  formatTime: (logObj: LogObject, options: FormatOptions) => string;
  formatLevel: (logObj: LogObject, options: FormatOptions) => string;
  formatPrefix: (logObj: LogObject, options: FormatOptions) => string;
  formatMsg: (logObj: LogObject, options: FormatOptions) => string;
}

export type FormatOptions = FormatHooks & {
  colorize?: boolean;
  timeStamp?: boolean;
  levelTag?: boolean;
};

export type LogLevel = LevelWithSilent | "verbose";

export type LoggerOptions = Partial<FormatOptions> & {
  level?: LogLevel;
  prefix?: string;
};

export interface FormattedLine {
  line: string;
  stream: "stdout" | "stderr";
}

export type Formatter = (rawLine: string, options: FormatOptions) => FormattedLine;

export interface Logger extends BaseLogger {
  verbose: (msg: string, ...args: unknown[]) => void;
}

export const LOG_LEVEL = {
  trace: 10,
  debug: 20,
  verbose: 25,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;
