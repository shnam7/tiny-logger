# tiny-logger

`tiny-logger` is a lightweight logger with [ts-log](https://github.com/kallaspriit/ts-log) interface that provides colored log output and prefix support.
It formats log levels with ANSI colors and routes messages to `stdout` or `stderr` depending on severity.

---

## Features

- Color-coded log levels (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`).
- Optional prefix for log messages.
- Writes `ERROR` and above to `stderr`, others to `stdout`.
- Compatible with `ts-log` interface.
- Respects `NO_COLOR` and non-TTY output by default (colors are automatically disabled when not writing to a terminal, or when `NO_COLOR` is set), and can be forced on/off explicitly via the `colorize` option.
- Every part of the output line (time, level, prefix, message) can be customized via format hooks.

---

## Installation

```bash
npm install tiny-logger
```

## Usage

### Create a Logger

```ts
import { createLogger } from "tiny-logger";

const logger = createLogger({ level: "trace", prefix: "MyApp" });

// Log messages
logger.trace("This is a trace message");
logger.debug("Debugging details here");
logger.verbose("Verbose granular details here");
logger.info("Application started");
logger.warn("Something looks suspicious");
logger.error("An error occurred");

// Logging native errors with full stack trace preservation
logger.error({ err: new Error("Database connection timeout") }, "Query failure");
```

Output is formatted as `H:MM:SS AM/PM LEVEL prefix message`, with the level and prefix color-coded when writing to a TTY.

### Default Logger

A lazily-created, process-wide logger instance, reused across calls that don't need their own configuration. It runs at the default `info` level and auto-detects color support based on the environment:

```ts
import { getDefaultLogger } from "tiny-logger";

const defaultLogger = getDefaultLogger();
defaultLogger.info("Using the default logger instance");
```

---

## Options

`createLogger` accepts a `LoggerOptions` object:

| Option         | Type                          | Description                                                                                                              |
| :------------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `level`        | `string`                      | Minimum pino log level to emit (`"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`, `"fatal"`, `"silent"`, `"verbose"`) |
| `prefix`       | `string`                      | Optional tag shown next to each log line                                                                                 |
| `colorize`     | `boolean`                     | Force color on (`true`) or off (`false`). Omit to auto-detect based on TTY / `NO_COLOR`                                  |
| `timeStamp`    | `boolean`                     | Toggle inclusion of the timestamp in output lines. Defaults to `true`                                                    |
| `levelTag`     | `boolean`                     | Toggle inclusion of the severity level tag. Defaults to `true`                                                           |
| `formatTime`   | `(logObj, options) => string` | Customize how the timestamp is rendered                                                                                  |
| `formatLevel`  | `(logObj, options) => string` | Customize how the level label is rendered                                                                                |
| `formatPrefix` | `(logObj, options) => string` | Customize how the prefix is rendered                                                                                     |
| `formatMsg`    | `(logObj, options) => string` | Customize how the message text is rendered                                                                               |

### Customizing Format Hooks

Any format hook you don't provide falls back to the built-in plain or colored formatting. Each hook receives the parsed `LogObject` and the full `FormatOptions` state context. For example, to keep the default coloring but wrap the message text:

```ts
import { createLogger } from "tiny-logger";

const logger = createLogger({
  colorize: true,
  formatMsg: (logObj, options) => `>> ${String(logObj.msg)} <<`,
});
```

---

## Type Definitions

```ts
import type { LevelWithSilent, SerializedError } from "tiny-logger";

export interface LogObject {
  level: number;
  time: number;
  pid: number | string;
  hostname: string;
  msg?: unknown;
  prefix?: string;
  err?: SerializedError; // Re-exported standardized error interface
  [key: string]: unknown;
}
```

## License

MIT
