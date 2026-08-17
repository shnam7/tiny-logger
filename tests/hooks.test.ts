import { describe, expect, it } from "vitest";
import { LOG_LEVEL } from "../src/common.ts";
import { plainFormatHooks, prettyFormatHooks } from "../src/hooks.ts";

// Helper utility to remove ANSI escape codes for validating raw text content
const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, "");

describe("LOG_LEVEL", () => {
  it("should have correct numeric mapping for standard pino log levels", () => {
    expect(LOG_LEVEL.trace).toBe(10);
    expect(LOG_LEVEL.debug).toBe(20);
    expect(LOG_LEVEL.info).toBe(30);
    expect(LOG_LEVEL.warn).toBe(40);
    expect(LOG_LEVEL.error).toBe(50);
    expect(LOG_LEVEL.fatal).toBe(60);
  });
});

describe("plainFormatHooks", () => {
  describe("formatTime", () => {
    it("should format time string to 12-hour format with AM/PM", () => {
      const timeISO = "2026-08-17T14:30:00.000Z";
      const formatted = plainFormatHooks.formatTime(timeISO);

      // Matches HH:MM:SS AM/PM pattern
      expect(formatted).toMatch(/\d{1,2}:\d{2}:\d{2}\s?(AM|PM)/i);
    });
  });

  describe("formatLevel", () => {
    it.each([
      [10, "TRACE"],
      [20, "DEBUG"],
      [30, "INFO"],
      [40, "WARN"],
      [50, "ERROR"],
      [60, "FATAL"],
    ])("should return plain level label '%s' for level %d", (levelNum, expectedLabel) => {
      const result = plainFormatHooks.formatLevel(levelNum);
      expect(result).toBe(expectedLabel);
    });
  });

  describe("formatPrefix & formatMsg", () => {
    it("should return the prefix string unchanged", () => {
      expect(plainFormatHooks.formatPrefix("my-prefix")).toBe("my-prefix");
    });

    it("should return the message string unchanged", () => {
      expect(plainFormatHooks.formatMsg("test message")).toBe("test message");
    });
  });
});

describe("prettyFormatHooks", () => {
  describe("formatTime", () => {
    it("should format time and wrap it with gray ANSI escape sequence", () => {
      const timeISO = "2026-08-17T14:30:00.000Z";
      const result = prettyFormatHooks.formatTime(timeISO);

      // Contains gray ANSI code (\x1b[90m)
      expect(result).toContain("\x1b[90m");
      expect(result.endsWith("\x1b[0m")).toBe(true);
      expect(stripAnsi(result)).toMatch(/\d{1,2}:\d{2}:\d{2}\s?(AM|PM)/i);
    });
  });

  describe("formatLevel", () => {
    it.each([
      [10, "TRACE", "\x1b[90mTRACE\x1b[0m"],
      [20, "DEBUG", "\x1b[34mDEBUG\x1b[0m"],
      [30, "INFO", "\x1b[32mINFO\x1b[0m"],
      [40, "WARN", "\x1b[33mWARN\x1b[0m"],
      [50, "ERROR", "\x1b[31mERROR\x1b[0m"],
      [60, "FATAL", "\x1b[41;37mFATAL\x1b[0m"],
    ])(
      "should return colorized level string for level %d",
      (levelNum, expectedText, expectedAnsi) => {
        const result = prettyFormatHooks.formatLevel(levelNum);

        expect(stripAnsi(result)).toBe(expectedText);
        expect(result).toBe(expectedAnsi);
      },
    );
  });

  describe("formatPrefix", () => {
    it("should wrap prefix with green ANSI color sequence", () => {
      const result = prettyFormatHooks.formatPrefix("my-prefix");

      expect(result).toBe("\x1b[32mmy-prefix\x1b[0m");
      expect(stripAnsi(result)).toBe("my-prefix");
    });
  });

  describe("formatMsg", () => {
    it("should format string message input using plainFormatHooks.formatTime logic", () => {
      const timeISO = "2026-08-17T14:30:00.000Z";
      const result = prettyFormatHooks.formatMsg(timeISO);

      expect(result).toMatch(timeISO);
    });
  });
});
