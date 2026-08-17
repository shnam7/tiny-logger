import { describe, expect, it } from "vitest";
import { plainFormatter } from "../src/plainFormatter.ts";

const createLogLine = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    level: 30,
    time: Date.now(),
    msg: "test message",
    prefix: "my-prefix",
    ...overrides,
  });

describe("plainFormatter", () => {
  describe("level formatting & stream routing", () => {
    it.each([
      [10, "TRACE", "stdout"],
      [20, "DEBUG", "stdout"],
      [30, "INFO", "stdout"],
      [40, "WARN", "stdout"],
      [50, "ERROR", "stderr"],
      [60, "FATAL", "stderr"],
    ])("formats level %d as %s and routes to %s", (level, expectedLabel, expectedStream) => {
      const result = plainFormatter(createLogLine({ level }));

      expect(result.line).toContain(expectedLabel);
      expect(result.stream).toBe(expectedStream);
    });

    it("defaults to INFO level formatting when level is invalid or missing", () => {
      const result = plainFormatter(createLogLine({ level: "invalid" }));

      expect(result.line).toContain("INFO");
      expect(result.stream).toBe("stdout");
    });
  });

  describe("content formatting", () => {
    it("formats the line with time, level, prefix, and message", () => {
      const result = plainFormatter(
        createLogLine({
          prefix: "service-a",
          msg: "user logged in",
        }),
      );

      expect(result.line).toContain("INFO [service-a]user logged in\n");
    });

    it("omits tag brackets when prefix is not provided", () => {
      const result = plainFormatter(createLogLine({ prefix: undefined }));

      expect(result.line).not.toContain("[");
      expect(result.line).not.toContain("]");
    });

    it("handles non-string msg gracefully by using an empty string", () => {
      const result = plainFormatter(createLogLine({ msg: 12345 }));

      expect(result.line).not.toContain("12345");
      expect(result.line.endsWith("\n")).toBe(true);
    });

    it("uses current timestamp when time field is missing or invalid", () => {
      const result = plainFormatter(createLogLine({ time: undefined }));

      expect(result.line).toMatch(/^\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("error handling", () => {
    it("appends error stack trace when err.stack is present", () => {
      const err = { stack: "Error: Something failed\n    at main.ts:10" };
      const result = plainFormatter(createLogLine({ level: 50, err }));

      expect(result.line).toContain(
        "ERROR [my-prefix]test message\nError: Something failed\n    at main.ts:10\n",
      );
    });

    it("falls back to err.message when err.stack is not present", () => {
      const err = { message: "Database connection failed" };
      const result = plainFormatter(createLogLine({ level: 50, err }));

      expect(result.line).toContain("Database connection failed\n");
    });

    it("does not append extra line when err object has no stack or message", () => {
      const result = plainFormatter(createLogLine({ level: 50, err: {} }));

      expect(result.line.match(/\n/g)).toHaveLength(1);
    });
  });

  describe("malformed JSON input", () => {
    it("returns raw line routed to stdout when JSON parsing fails", () => {
      const rawLine = "plain text log line without json formatting";
      const result = plainFormatter(rawLine);

      expect(result).toEqual({
        line: rawLine,
        stream: "stdout",
      });
    });
  });
});
