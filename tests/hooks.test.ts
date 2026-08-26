import { describe, expect, it } from "vitest";
import { type FormatOptions, LOG_LEVEL, type LogObject } from "../src/common.ts";
import { plainFormatHooks, prettyFormatHooks } from "../src/hooks.ts";

const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, "");

const timePattern = /\d{1,2}:\d{2}:\d{2}\s?(AM|PM)/i;

const createMockLogObj = (overrides: Partial<LogObject> = {}): LogObject => ({
  level: 30,
  time: Date.now(),
  pid: 12345,
  hostname: "localhost",
  ...overrides,
});

const createMockFormatOptions = (overrides: Partial<FormatOptions> = {}): FormatOptions => ({
  formatTime: plainFormatHooks.formatTime,
  formatLevel: plainFormatHooks.formatLevel,
  formatPrefix: plainFormatHooks.formatPrefix,
  formatMsg: plainFormatHooks.formatMsg,
  colorize: true,
  timeStamp: true,
  levelTag: true,
  ...overrides,
});

const defaultOptions = createMockFormatOptions();
const staticTimeMs = new Date("2026-08-17T14:30:00.000Z").getTime();

describe("LOG_LEVEL Specifications", () => {
  it("should have correct numeric mapping for standard pino log levels including verbose", () => {
    expect(LOG_LEVEL.trace).toBe(10);
    expect(LOG_LEVEL.debug).toBe(20);
    expect(LOG_LEVEL.verbose).toBe(25);
    expect(LOG_LEVEL.info).toBe(30);
    expect(LOG_LEVEL.warn).toBe(40);
    expect(LOG_LEVEL.error).toBe(50);
    expect(LOG_LEVEL.fatal).toBe(60);
  });
});

describe("Plain Format Hooks", () => {
  it("formatTime - should format time string to 12-hour format with AM/PM", () => {
    const mockLog = createMockLogObj({ time: staticTimeMs });
    const formatted = plainFormatHooks.formatTime(mockLog, defaultOptions);
    expect(formatted).toMatch(timePattern);
  });

  it.each([
    ["TRACE", 10],
    ["DEBUG", 20],
    ["VERBOSE", 25],
    ["INFO", 30],
    ["WARN", 40],
    ["ERROR", 50],
    ["FATAL", 60],
  ])(
    "formatLevel - should return plain level label '%s' for level %d",
    (expectedLabel, levelNum) => {
      const mockLog = createMockLogObj({ level: levelNum });
      expect(plainFormatHooks.formatLevel(mockLog, defaultOptions)).toBe(expectedLabel);
    },
  );

  it("formatPrefix - should return the prefix string unchanged", () => {
    const mockLog = createMockLogObj({ prefix: "my-prefix" });
    expect(plainFormatHooks.formatPrefix(mockLog, defaultOptions)).toBe("my-prefix");
  });

  it("formatMsg - should return stringified msg for string and objects, avoiding 'undefined'", () => {
    const mockStrLog = createMockLogObj({ msg: "test message" });
    expect(plainFormatHooks.formatMsg(mockStrLog, defaultOptions)).toBe("test message");

    const mockObjLog = createMockLogObj({ msg: { foo: "bar" } });
    expect(plainFormatHooks.formatMsg(mockObjLog, defaultOptions)).toBe('{"foo":"bar"}');

    const mockEmptyLog = createMockLogObj({ msg: undefined });
    expect(plainFormatHooks.formatMsg(mockEmptyLog, defaultOptions)).toBe("");
  });
});

describe("Pretty Format Hooks", () => {
  it("formatTime - should format time and wrap it with gray ANSI escape sequence", () => {
    const mockLog = createMockLogObj({ time: staticTimeMs });
    const result = prettyFormatHooks.formatTime(mockLog, defaultOptions);

    expect(result).toContain("\x1b[90m");
    expect(result.endsWith("\x1b[0m")).toBe(true);
    expect(stripAnsi(result)).toMatch(timePattern);
  });

  it.each([
    [10, "TRACE", "\x1b[90mTRACE\x1b[0m"],
    [20, "DEBUG", "\x1b[34mDEBUG\x1b[0m"],
    [25, "VERBOSE", "\x1b[36mVERBOSE\x1b[0m"],
    [30, "INFO", "\x1b[36mINFO\x1b[0m"],
    [40, "WARN", "\x1b[33mWARN\x1b[0m"],
    [50, "ERROR", "\x1b[31mERROR\x1b[0m"],
    [60, "FATAL", "\x1b[41;37mFATAL\x1b[0m"],
  ])(
    "formatLevel - should return colorized level string for level %d",
    (levelNum, expectedText, expectedAnsi) => {
      const mockLog = createMockLogObj({ level: levelNum });
      const result = prettyFormatHooks.formatLevel(mockLog, defaultOptions);

      expect(stripAnsi(result)).toBe(expectedText);
      expect(result).toBe(expectedAnsi);
    },
  );

  it("formatPrefix - should wrap prefix with appropriate color sequence based on severity", () => {
    const mockVerboseLog = createMockLogObj({ level: 25, prefix: "my-prefix" });
    const verboseResult = prettyFormatHooks.formatPrefix(mockVerboseLog, defaultOptions);
    expect(verboseResult).toBe("\x1b[36mmy-prefix\x1b[0m");
    expect(stripAnsi(verboseResult)).toBe("my-prefix");

    const mockInfoLog = createMockLogObj({ level: 30, prefix: "my-prefix" });
    const infoResult = prettyFormatHooks.formatPrefix(mockInfoLog, defaultOptions);
    expect(infoResult).toBe("\x1b[36mmy-prefix\x1b[0m");
    expect(stripAnsi(infoResult)).toBe("my-prefix");

    const mockWarnLog = createMockLogObj({ level: 40, prefix: "my-prefix" });
    const warnResult = prettyFormatHooks.formatPrefix(mockWarnLog, defaultOptions);
    expect(warnResult).toBe("\x1b[33mmy-prefix\x1b[0m");
    expect(stripAnsi(warnResult)).toBe("my-prefix");

    const mockErrorLog = createMockLogObj({ level: 50, prefix: "my-prefix" });
    const errorResult = prettyFormatHooks.formatPrefix(mockErrorLog, defaultOptions);
    expect(errorResult).toBe("\x1b[31mmy-prefix\x1b[0m");
    expect(stripAnsi(errorResult)).toBe("my-prefix");
  });

  it("formatPrefix - should wrap prefix with level color even if levelTag option is toggled", () => {
    const customOptions = createMockFormatOptions({ levelTag: false });
    const mockFatalLog = createMockLogObj({ level: 60, prefix: "my-prefix" });

    const result = prettyFormatHooks.formatPrefix(mockFatalLog, customOptions);
    expect(result).toBe("\x1b[41;37mmy-prefix\x1b[0m");
    expect(stripAnsi(result)).toBe("my-prefix");
  });

  it("formatPrefix - should return empty string if prefix is missing", () => {
    const mockNoPrefixLog = createMockLogObj({ prefix: undefined });
    expect(prettyFormatHooks.formatPrefix(mockNoPrefixLog, defaultOptions)).toBe("");
  });

  it("formatMsg - should format and output string messages correctly without matching timestamps", () => {
    const messageText = "hello world log message";
    const mockLog = createMockLogObj({ msg: messageText });
    const result = prettyFormatHooks.formatMsg(mockLog, defaultOptions);

    expect(result).toBe(messageText);
  });
});
