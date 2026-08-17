import type { FormatHooks } from "./common.ts";
import { LOG_LEVEL } from "./common.ts";

const colors = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  bgRed: (s: string) => `\x1b[41;37m${s}\x1b[0m`,
};

//--- plain formatter
export const plainFormatHooks: FormatHooks = {
  formatTime: (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("en-US", { hour12: true });
  },
  formatLevel: (levelNum: number) => {
    if (levelNum <= LOG_LEVEL.trace) return "TRACE";
    if (levelNum <= LOG_LEVEL.debug) return "DEBUG";
    if (levelNum <= LOG_LEVEL.info) return "INFO";
    if (levelNum <= LOG_LEVEL.warn) return "WARN";
    if (levelNum <= LOG_LEVEL.error) return "ERROR";
    return "FATAL";
  },
  formatPrefix: (prefixStr: string) => prefixStr,
  formatMsg: (msgStr: string) => msgStr,
};

//--- pretty formatter
export const prettyFormatHooks: FormatHooks = {
  formatTime: (timeStr: string) => colors.gray(plainFormatHooks.formatTime(timeStr)),
  formatLevel: (levelNum: number) => {
    if (levelNum <= LOG_LEVEL.trace) return colors.gray("TRACE");
    if (levelNum <= LOG_LEVEL.debug) return colors.blue("DEBUG");
    if (levelNum <= LOG_LEVEL.info) return colors.green("INFO");
    if (levelNum <= LOG_LEVEL.warn) return colors.yellow("WARN");
    if (levelNum <= LOG_LEVEL.error) return colors.red("ERROR");
    return colors.bgRed("FATAL");
  },
  formatPrefix: (prefixStr: string) => colors.green(plainFormatHooks.formatPrefix(prefixStr)),
  // was: plainFormatHooks.formatTime(msgStr) - fed the message through the
  // time formatter (typo). The message isn't colorized, same as plain mode.
  formatMsg: (msgStr: string) => plainFormatHooks.formatMsg(msgStr),
};
