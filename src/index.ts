import { Writable } from "node:stream";
import pino from "pino";
import type { Logger } from "ts-log";
import type { FormattedLine } from "./common.ts";
import { plainFormatter } from "./plainFormatter.ts";
import { prettyFormatter } from "./prettyFormatter.ts";

export type LoggerOptions = Pick<pino.LoggerOptions, "level"> & {
  colorize?: boolean;
  prefix?: string;
};

let defaultLogger: Logger | undefined;

// Default color support checker
const isColorSupported = (): boolean => Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

function createFormattedStream(formatter: (line: string) => FormattedLine): Writable {
  return new Writable({
    write(chunk: Buffer | string, _encoding, callback) {
      const { line, stream } = formatter(chunk.toString());
      (stream === "stderr" ? process.stderr : process.stdout).write(line);
      callback();
    },
  });
}

export function createLogger(options: LoggerOptions = {}): Logger {
  const pinoOptions: pino.LoggerOptions = {};
  if (options.level !== undefined) pinoOptions.level = options.level;

  const shouldColorize = options.colorize ?? isColorSupported();
  const formatter = shouldColorize ? prettyFormatter : plainFormatter;

  return pino(pinoOptions, createFormattedStream(formatter)).child({
    prefix: options.prefix,
  });
}

export function getDefaultLogger(): Logger {
  defaultLogger ??= createLogger({ level: "trace", colorize: true });
  return defaultLogger;
}
