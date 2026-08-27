# tiny-logger

`tiny-logger` is a lightweight logger with a [ts-log](https://github.com/kallaspriit/ts-log) interface that provides colored log output and prefix support.
It formats log levels with ANSI colors and routes messages to `stdout` or `stderr` depending on severity.

---

## Features

- Color-coded log levels (`TRACE`, `DEBUG`, `VERBOSE`, `INFO`, `WARN`, `ERROR`, `FATAL`).
- Optional prefix for log messages.
- Writes `ERROR` and above to `stderr`, others to `stdout`.
- Compatible with the `ts-log` interface.
- Disables color automatically when `NO_COLOR` is set or output isn't a TTY, with an explicit override via the `colorize` option.
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

### Polyfilling `verbose`

`withVerbose` guarantees a logger exposes a `verbose` method, falling back to `debug` (or an explicit function you provide) when the underlying logger doesn't define one natively — handy when wrapping loggers like `console` that don't implement `verbose`:

```ts
import { withVerbose } from "tiny-logger";

const logger = withVerbose(console); // console.verbose doesn't exist, so it falls back to console.debug
logger.verbose("Verbose granular details here");

// custom function supported:
const logger2 = withVerbose(console, console.debug); // same as withVerbose(console);
const logger3 = withVerbose(console, (...args) => {
  console.log("this is a verbose message:", ...args);
});
```

### Silent Logger

This is useful for suppressing all output from third-party APIs that accept a custom logger.

```ts
import { getSilentLogger } from "tiny-logger";
import { copyChangedSync } from "copy-changed";

const silentLogger = getSilentLogger();
copyChangedSync({ logger: silentLogger }); // suppress all output messages
```

---

## Options

`createLogger` accepts a `LoggerOptions` object:

| Option         | Type                          | Description                                                                                                              |
| :------------- | :---------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `level`        | `string`                      | Minimum pino log level to emit (`"trace"`, `"debug"`, `"verbose"`, `"info"`, `"warn"`, `"error"`, `"fatal"`, `"silent"`) |
| `prefix`       | `string`                      | Optional tag shown next to each log line                                                                                 |
| `colorize`     | `boolean`                     | Force color on (`true`) or off (`false`). Omit to auto-detect based on TTY / `NO_COLOR`                                  |
| `timeStamp`    | `boolean`                     | Toggle inclusion of the timestamp in output lines. Defaults to `true`                                                    |
| `levelTag`     | `boolean`                     | Toggle inclusion of the severity level tag. Defaults to `true`                                                           |
| `formatTime`   | `(logObj, options) => string` | Customize how the timestamp is rendered                                                                                  |
| `formatLevel`  | `(logObj, options) => string` | Customize how the level label is rendered                                                                                |
| `formatPrefix` | `(logObj, options) => string` | Customize how the prefix is rendered                                                                                     |
| `formatMsg`    | `(logObj, options) => string` | Customize how the message text is rendered                                                                               |

### Customizing Format Hooks

Any format hook you don't provide falls back to the built-in plain or colored formatting. Each hook receives the parsed `LogObject` and the full `FormatOptions` context. For example, to keep the default coloring but wrap the message text:

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
import type { LogLevel, SerializedError } from "tiny-logger";

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

`LogLevel` is the union of pino's standard levels plus `"silent"` and the custom `"verbose"` level (`"trace" | "debug" | "verbose" | "info" | "warn" | "error" | "fatal" | "silent"`), used as the type for the `level` option.

## Credits
`tiny-logger` uses:

- [ts-log](https://github.com/kallaspriit/ts-log) as the base log interface.
- [pino](https://github.com/pinojs/pino) as the underlying log engine.

## License

MIT
