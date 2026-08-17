# tiny-logger

`tiny-logger` is a lightweight logger with [ts-log](https://github.com/kallaspriit/ts-log) intrface that provides colored log output and prefix support.
It formats log levels with ANSI colors and routes messages to `stdout` or `stderr` depending on severity.

---

## Features

- Color-coded log levels (`TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`)
- Optional prefix for log messages
- Writes `ERROR` and above to `stderr`, others to `stdout`
- Compatible with `ts-log` interface
- Respects `NO_COLOR` and non-TTY output (colors are automatically disabled when not writing to a terminal, or when `NO_COLOR` is set)
- Graceful handling of unparseable/non-JSON log lines (passed through unchanged)

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
logger.info("Application started");
logger.warn("Something looks suspicious");
logger.error("An error occurred");
```

Output is formatted as `HH:MM:ss LEVEL [prefix] message`, with the level and prefix color-coded when writing to a TTY.

### Default Logger

A lazily-created, process-wide logger instance, reused across calls that don't need their own configuration:

```ts
import { getDefaultLogger } from "tiny-logger";

const defaultLogger = getDefaultLogger();
defaultLogger.info("Using the default logger instance");
```

### Options

`createLogger` accepts a `LoggerOptions` object:

| Option     | Type      | Description                                                                                     |
| ---------- | --------- | ----------------------------------------------------------------------------------------------- |
| `level`    | `string`  | Minimum pino log level to emit (`"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"`, `"fatal"`) |
| `prefix`   | `string`  | Optional tag shown as `[prefix]` next to each log line                                          |
| `colorize` | `boolean` | Enable or disable color (currently color is auto-detected via TTY/`NO_COLOR`)                   |

## License

MIT
