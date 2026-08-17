import { type FormattedLine, formatTime, LOG_LEVEL } from "./common.ts";

// Pre-compiled ANSI color palette
const colors = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  bgRed: (s: string) => `\x1b[41;37m${s}\x1b[0m`,
};

const getFormattedLevel = (levelNum: number): string => {
  if (levelNum <= LOG_LEVEL.trace) return colors.gray("TRACE");
  if (levelNum <= LOG_LEVEL.debug) return colors.blue("DEBUG");
  if (levelNum <= LOG_LEVEL.info) return colors.green("INFO");
  if (levelNum <= LOG_LEVEL.warn) return colors.yellow("WARN");
  if (levelNum <= LOG_LEVEL.error) return colors.red("ERROR");
  return colors.bgRed("FATAL");
};

export function prettyFormatter(rawLine: string): FormattedLine {
  try {
    const logObj = JSON.parse(rawLine);
    const levelNum = Number(logObj.level) || LOG_LEVEL.info;

    const timeStr = formatTime(Number(logObj.time) || Date.now());
    const levelStr = getFormattedLevel(levelNum);
    const tagStr = logObj.prefix ? `${colors.green(`[${logObj.prefix}]`)} ` : "";
    const msgStr = typeof logObj.msg === "string" ? logObj.msg : "";

    let line = `${colors.gray(timeStr)} ${levelStr} ${tagStr}${msgStr}\n`;

    if (logObj.err) {
      const detail = typeof logObj.err.stack === "string" ? logObj.err.stack : logObj.err.message;
      if (detail) line += `${detail}\n`;
    }

    return { line, stream: levelNum >= LOG_LEVEL.error ? "stderr" : "stdout" };
  } catch {
    return { line: rawLine, stream: "stdout" };
  }
}
