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
let silentLogger: Logger | undefined;

// NO_COLOR spec: presence of the variable disables color, regardless of its value.
const isColorSupported = (): boolean =>
  Boolean(process.stdout.isTTY) && !("NO_COLOR" in process.env);

export function formatter(rawLine: string, options: FormatOptions): FormattedLine {
  if (!rawLine || rawLine === "\n" || rawLine === "\r\n") {
    return { line: "", stream: "stdout" };
  }

  try {
    const logObj = JSON.parse(rawLine) as LogObject;

    logObj.time = Number(logObj.time ?? Date.now());
    logObj.level = Number(logObj.level ?? LOG_LEVEL.info);

    const timeStr = options.timeStamp ? options.formatTime(logObj, options) : "";
    const levelStr = options.levelTag ? options.formatLevel(logObj, options) : "";
    const prefixStr = logObj.prefix ? options.formatPrefix(logObj, options) : "";
    const msgStr = logObj.msg !== undefined ? options.formatMsg(logObj, options) : "";

    let line = "";
    if (timeStr) line += timeStr;
    if (levelStr) line += (line ? " " : "") + levelStr;
    if (prefixStr) line += (line ? " " : "") + prefixStr;
    if (msgStr) line += (line ? " " : "") + msgStr;
    line += "\n";

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

function createFormattedStream(fmt: Formatter, options: FormatOptions): Writable {
  return new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      const { line, stream } = fmt(chunk.toString(), options);
      if (line) (stream === "stderr" ? process.stderr : process.stdout).write(line);
      callback();
    },
  });
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const pinoOptions: pino.LoggerOptions = {
    serializers: { err: pino.stdSerializers.err },
    customLevels: { verbose: LOG_LEVEL.verbose },
    useOnlyCustomLevels: false, // false means standard levels(info, debug, etc) will be used.
    level: options.level ?? "info",
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

export function getSilentLogger(): Logger {
  silentLogger ??= createLogger({ level: "silent" });
  return silentLogger;
}

export function withVerbose(logger: Partial<Logger>, verbose?: Logger["verbose"]): Logger {
  if (logger.verbose) return logger as Logger;

  const fallbackVerbose = verbose ?? logger.debug;
  if (!fallbackVerbose) {
    throw new Error("Cannot polyfill verbose method: fallback is missing");
  }

  const boundVerbose = fallbackVerbose.bind(logger);
  // Proxy instead of object spread, so prototype-based methods (e.g. console) aren't dropped.
  return new Proxy(logger, {
    get(target, prop, receiver) {
      return prop === "verbose" ? boundVerbose : Reflect.get(target, prop, receiver);
    },
  }) as Logger;
}
