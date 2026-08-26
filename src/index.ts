import { Writable } from "node:stream";
import pino from "pino";
import {
  type FormatOptions,
  type FormattedLine,
  type Formatter,
  LOG_LEVEL,
  type Logger,
  type LoggerOptions,
  type LogObject,
} from "./common.ts";
import { plainFormatHooks, prettyFormatHooks } from "./hooks.ts";

export * from "./common.ts";
export * from "./hooks.ts";
export type { Logger };

let defaultLogger: Logger | undefined;

const isColorSupported = (): boolean => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

export function formatter(rawLine: string, options: FormatOptions): FormattedLine {
  if (!rawLine || rawLine === "\n" || rawLine === "\r\n") {
    return { line: "", stream: "stdout" };
  }

  try {
    const logObj = JSON.parse(rawLine) as LogObject;

    logObj.time = Number(logObj.time || Date.now());
    logObj.level = Number(logObj.level ?? LOG_LEVEL.info);

    const timeStr = options.timeStamp ? options.formatTime(logObj, options) : "";
    const levelStr = options.levelTag ? options.formatLevel(logObj, options) : "";
    const prefixStr = logObj.prefix ? options.formatPrefix(logObj, options) : "";
    const msgStr = logObj.msg !== undefined ? options.formatMsg(logObj, options) : "";

    let line = `${[timeStr, levelStr, prefixStr, msgStr].filter((s) => s.length > 0).join(" ")}\n`;

    if (logObj.err && typeof logObj.err === "object") {
      const detail =
        typeof logObj.err.stack === "string"
          ? logObj.err.stack
          : typeof logObj.err.message === "string"
            ? logObj.err.message
            : null;

      if (detail) {
        line += detail.endsWith("\n") ? detail : `${detail}\n`;
      }
    }
    return { line, stream: logObj.level >= LOG_LEVEL.error ? "stderr" : "stdout" };
  } catch {
    return { line: rawLine.endsWith("\n") ? rawLine : `${rawLine}\n`, stream: "stdout" };
  }
}

function createFormattedStream(formatter: Formatter, options: FormatOptions): Writable {
  return new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      const { line, stream } = formatter(chunk.toString(), options);
      if (line) (stream === "stderr" ? process.stderr : process.stdout).write(line);
      callback();
    },
  });
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const pinoOptions: pino.LoggerOptions = {
    serializers: { err: pino.stdSerializers.err },
    customLevels: { verbose: LOG_LEVEL.verbose },
    useOnlyCustomLevels: false, // 표준 레벨(info, debug 등)도 하이브리드로 함께 사용하도록 명시
    level: options.level ?? "info", // 임의 변환 필터링 레이어 없이 "verbose" 및 "silent" 등을 네이티브 수용
  };

  const shouldColorize = options.colorize ?? isColorSupported();
  const defaultHooks = shouldColorize ? prettyFormatHooks : plainFormatHooks;

  const formatOptions: FormatOptions = {
    formatTime: options.formatTime ?? defaultHooks.formatTime,
    formatLevel: options.formatLevel ?? defaultHooks.formatLevel,
    formatPrefix: options.formatPrefix ?? defaultHooks.formatPrefix,
    formatMsg: options.formatMsg ?? defaultHooks.formatMsg,
    timeStamp: options.timeStamp ?? true,
    levelTag: options.levelTag ?? true,
  };

  const stream = createFormattedStream(formatter, formatOptions);
  const logger = pino(pinoOptions, stream);

  return options.prefix
    ? (logger.child({ prefix: options.prefix }) as unknown as Logger)
    : (logger as unknown as Logger);
}

export function getDefaultLogger(): Logger {
  defaultLogger ??= createLogger({});
  return defaultLogger;
}
