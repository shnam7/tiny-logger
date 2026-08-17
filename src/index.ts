import { Writable } from "node:stream";
import pino from "pino";
import type { Logger } from "ts-log";
import {
  type FormatHooks,
  type FormattedLine,
  type Formatter,
  LOG_LEVEL,
  type LoggerOptions,
} from "./common.ts";
import { plainFormatHooks, prettyFormatHooks } from "./hooks.ts";

export * from "./common.ts";
export * from "./hooks.ts";

let defaultLogger: Logger | undefined;

const isColorSupported = (): boolean => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

export function formatter(rawLine: string, hooks: FormatHooks): FormattedLine {
  try {
    const logObj = JSON.parse(rawLine);
    const levelNum = Number(logObj.level ?? LOG_LEVEL.info);
    const timeStr = hooks.formatTime(logObj.time ?? Date.now());
    const levelStr = hooks.formatLevel(levelNum);
    const prefixStr = hooks.formatPrefix(logObj.prefix ? `${logObj.prefix}` : "");
    const msgStr = hooks.formatMsg(typeof logObj.msg === "string" ? logObj.msg : "");
    let line = `${timeStr} ${levelStr} ${prefixStr} ${msgStr}\n`;

    if (logObj.err) {
      const detail = typeof logObj.err.stack === "string" ? logObj.err.stack : logObj.err.message;
      if (detail) line += `${detail}\n`;
    }

    return { line, stream: levelNum >= LOG_LEVEL.error ? "stderr" : "stdout" };
  } catch {
    return { line: rawLine, stream: "stdout" };
  }
}

function createFormattedStream(formatter: Formatter, hooks: FormatHooks): Writable {
  return new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      const { line, stream } = formatter(chunk.toString(), hooks);
      (stream === "stderr" ? process.stderr : process.stdout).write(line);
      callback();
    },
  });
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const pinoOptions: pino.LoggerOptions = {};
  if (options.level !== undefined) pinoOptions.level = options.level;

  const shouldColorize = options.colorize ?? isColorSupported();
  const defaultHooks = shouldColorize ? prettyFormatHooks : plainFormatHooks;

  // Per-field hook overrides (formatTime/formatLevel/formatPrefix/formatMsg)
  // fall back to the colorize-appropriate default set, not always "plain".
  const hooks: FormatHooks = {
    formatTime: options.formatTime ?? defaultHooks.formatTime,
    formatLevel: options.formatLevel ?? defaultHooks.formatLevel,
    formatPrefix: options.formatPrefix ?? defaultHooks.formatPrefix,
    formatMsg: options.formatMsg ?? defaultHooks.formatMsg,
  };

  return pino(pinoOptions, createFormattedStream(formatter, hooks)).child({
    prefix: options.prefix,
  });
}

export function getDefaultLogger(): Logger {
  defaultLogger ??= createLogger({ level: "trace", colorize: true });
  return defaultLogger;
}
