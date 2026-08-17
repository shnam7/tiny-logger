import type pino from "pino";

export interface FormatHooks {
  formatTime: (timeStr: string) => string;
  formatLevel: (levelNum: number) => string;
  formatPrefix: (prefixStr: string) => string;
  formatMsg: (msgStr: string) => string;
}

export type LoggerOptions = Pick<pino.LoggerOptions, "level"> &
  Partial<FormatHooks> & {
    prefix?: string;
    colorize?: boolean;
  };

export interface FormattedLine {
  line: string;
  stream: "stdout" | "stderr";
}

// formatter only ever needs the four format hooks - not the full
// LoggerOptions grab-bag (level/prefix/colorize are consumed earlier, when
// createLogger picks which hook set to use).
export type Formatter = (rawLine: string, hooks: FormatHooks) => FormattedLine;

export const LOG_LEVEL = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;
