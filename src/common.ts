export interface FormattedLine {
  line: string;
  stream: "stdout" | "stderr";
}

export type Formatter = (rawLine: string) => FormattedLine;

export const LOG_LEVEL = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;
