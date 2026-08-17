import { describe, expect, it } from "vitest";
import { prettyFormatter } from "../src/prettyFormatter.ts";

// Utility to remove ANSI escape codes for verifying raw text content
const stripAnsi = (str: string): string => str.replace(/\x1b\[[0-9;]*m/g, "");

const createLogLine = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    level: 30,
    time: Date.now(),
    msg: "test message",
    prefix: "my-prefix",
    ...overrides,
  });

describe("prettyFormatter", () => {
  describe("level formatting & stream routing", () => {
    it.each([
      [10, "TRACE", "stdout", "\x1b[90mTRACE\x1b[0m"],
      [20, "DEBUG", "stdout", "\x1b[34mDEBUG\x1b[0m"],
      [30, "INFO", "stdout", "\x1b[32mINFO\x1b[0m"],
      [40, "WARN", "stdout", "\x1b[33mWARN\x1b[0m"],
      [50, "ERROR", "stderr", "\x1b[31mERROR\x1b[0m"],
      [60, "FATAL", "stderr", "\x1b[41;37mFATAL\x1b[0m"],
    ])(
      "formats level %d as %s with correct ANSI color and routes to %s",
      (level, expectedLabel, expectedStream, expectedAnsi) => {
        const result = prettyFormatter(createLogLine({ level }));

        expect(stripAnsi(result.line)).toContain(expectedLabel);
        expect(result.line).toContain(expectedAnsi);
        expect(result.stream).toBe(expectedStream);
      },
    );

    it("defaults to INFO level formatting when level is invalid or missing", () => {
      const result = prettyFormatter(createLogLine({ level: "invalid" }));

      expect(stripAnsi(result.line)).toContain("INFO");
      expect(result.stream).toBe("stdout");
    });
  });

  describe("content formatting & ANSI styling", () => {
    it("formats time and prefix with green color escape sequences", () => {
      const result = prettyFormatter(
        createLogLine({
          prefix: "service-a",
          msg: "colored log test",
        }),
      );

      // Verify prefix tag contains green ANSI sequence (\x1b[32m)
      expect(result.line).toContain("\x1b[32m[service-a]\x1b[0m");
      expect(stripAnsi(result.line)).toContain("INFO [service-a] colored log test\n");
    });

    it("omits tag brackets entirely when prefix is not provided", () => {
      const result = prettyFormatter(createLogLine({ prefix: undefined }));

      expect(stripAnsi(result.line)).not.toContain("[");
      expect(stripAnsi(result.line)).not.toContain("]");
    });

    it("handles non-string msg gracefully by using an empty string", () => {
      const result = prettyFormatter(createLogLine({ msg: null }));

      expect(stripAnsi(result.line)).not.toContain("null");
      expect(result.line.endsWith("\n")).toBe(true);
    });

    it("uses current timestamp when time field is missing or invalid", () => {
      const result = prettyFormatter(createLogLine({ time: undefined }));

      const plainLine = stripAnsi(result.line);
      expect(plainLine).toMatch(/^\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("error details", () => {
    it("appends error stack trace without extra ANSI styling", () => {
      const err = { stack: "Error: Something failed\n    at main.ts:10" };
      const result = prettyFormatter(createLogLine({ level: 50, err }));

      expect(result.line).toContain("Error: Something failed\n    at main.ts:10\n");
    });

    it("falls back to err.message when err.stack is missing", () => {
      const err = { message: "Failed without stack" };
      const result = prettyFormatter(createLogLine({ level: 50, err }));

      expect(result.line).toContain("Failed without stack\n");
    });

    it("does not append extra line when err has no stack or message", () => {
      const result = prettyFormatter(createLogLine({ level: 50, err: {} }));

      expect(result.line.match(/\n/g)).toHaveLength(1);
    });
  });

  describe("malformed JSON input", () => {
    it("returns raw line routed to stdout when JSON parsing fails", () => {
      const rawLine = "plain unparseable text";
      const result = prettyFormatter(rawLine);

      expect(result).toEqual({
        line: rawLine,
        stream: "stdout",
      });
    });
  });
});
