import { type FormattedLine, LOG_LEVEL } from "./common.ts";

/**
 * Creates a stream formatter dedicated to either colored or plain ANSI output.
 */
const getFormattedLevel = (levelNum: number): string => {
  if (levelNum <= LOG_LEVEL.trace) return "TRACE";
  if (levelNum <= LOG_LEVEL.debug) return "DEBUG";
  if (levelNum <= LOG_LEVEL.info) return "INFO";
  if (levelNum <= LOG_LEVEL.warn) return "WARN";
  if (levelNum <= LOG_LEVEL.error) return "ERROR";
  return "FATAL";
};

export function plainFormatter(rawLine: string): FormattedLine {
  try {
    const logObj = JSON.parse(rawLine);
    const levelNum = Number(logObj.level) || LOG_LEVEL.info;

    const timeStr = new Date(logObj.time || Date.now()).toLocaleTimeString("en-US", {
      hour12: false,
    });
    const levelStr = getFormattedLevel(levelNum);
    const tagStr = logObj.prefix ? `[${logObj.prefix}]` : "";
    const msgStr = typeof logObj.msg === "string" ? logObj.msg : "";

    let line = `${timeStr} ${levelStr} ${tagStr}${msgStr}\n`;

    if (logObj.err) {
      const detail = typeof logObj.err.stack === "string" ? logObj.err.stack : logObj.err.message;
      if (detail) line += `${detail}\n`;
    }

    return { line, stream: levelNum >= LOG_LEVEL.error ? "stderr" : "stdout" };
  } catch {
    return { line: rawLine, stream: "stdout" };
  }
}
