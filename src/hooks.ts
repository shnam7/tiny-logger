import type { FormatHooks, FormatOptions, LogObject } from "./common.ts";
import { LOG_LEVEL } from "./common.ts";

const colors = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  purple: (s: string) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  white: (s: string) => `\x1b[37m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  bgRed: (s: string) => `\x1b[41;37m${s}\x1b[0m`,
};

function levelToNameColorPair(level: number): [string, (s: string) => string] {
  if (level <= LOG_LEVEL.trace) return ["TRACE", colors.gray];
  if (level <= LOG_LEVEL.debug) return ["DEBUG", colors.blue];
  if (level <= LOG_LEVEL.verbose) return ["VERBOSE", colors.cyan];
  if (level <= LOG_LEVEL.info) return ["INFO", colors.cyan];
  if (level <= LOG_LEVEL.warn) return ["WARN", colors.yellow];
  if (level <= LOG_LEVEL.error) return ["ERROR", colors.red];
  return ["FATAL", colors.bgRed];
}

//--- plain formatter
export const plainFormatHooks: FormatHooks = {
  formatTime: (logObj: LogObject, _options: FormatOptions) => {
    const timeMs = typeof logObj.time === "number" ? logObj.time : Date.now();
    return new Date(timeMs).toLocaleTimeString("en-US", { hour12: true });
  },
  formatLevel: (logObj: LogObject, _options: FormatOptions) => {
    const [name, _color] = levelToNameColorPair(logObj.level);
    return name;
  },
  formatPrefix: (logObj: LogObject, _options: FormatOptions) => {
    return logObj.prefix ?? "";
  },
  formatMsg: (logObj: LogObject, _options: FormatOptions) => {
    if (logObj.msg === undefined || logObj.msg === null) return "";
    return typeof logObj.msg === "object" ? JSON.stringify(logObj.msg) : String(logObj.msg);
  },
};

//--- pretty formatter
export const prettyFormatHooks: FormatHooks = {
  formatTime: (logObj: LogObject, options: FormatOptions) =>
    colors.gray(plainFormatHooks.formatTime(logObj, options)),

  formatLevel: (logObj: LogObject, _options: FormatOptions) => {
    const [name, color] = levelToNameColorPair(logObj.level);
    return color(name);
  },

  formatPrefix: (logObj: LogObject, _options: FormatOptions) => {
    if (!logObj.prefix) return "";

    const [_, color] = levelToNameColorPair(logObj.level);
    return color(logObj.prefix);
  },

  formatMsg: (logObj: LogObject, options: FormatOptions) =>
    plainFormatHooks.formatMsg(logObj, options),
};
