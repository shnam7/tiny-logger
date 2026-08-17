import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLogger, getDefaultLogger } from "../src/index.ts";

describe("Print sample output", () => {
  it("prints defaultLogger messages", () => {
    const logger = getDefaultLogger();
    logger.level = "debug";

    logger.trace("This is a trace message");
    logger.debug("Debugging details here");
    logger.info("Application started");
    logger.warn("Something looks suspicious");
    logger.error("An error occurred");
  });

  it("prints customLogger messages", () => {
    const logger = createLogger({ prefix: "[tiny-logger]", level: "trace", colorize: true });

    logger.trace("This is a trace message");
    logger.debug("Debugging details here");
    logger.info("Application started");
    logger.warn("Something looks suspicious");
    logger.error("An error occurred");
  });
  it("prints customLogger messages", () => {
    const logger = createLogger({ prefix: "[tiny-logger]", level: "trace", colorize: false });

    logger.trace("This is a trace message");
    logger.debug("Debugging details here");
    logger.info("Application started");
    logger.warn("Something looks suspicious");
    logger.error("An error occurred");
  });
});

describe("Logger Factory & Wiring", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  const originalIsTTY = process.stdout.isTTY;
  const originalNoColor = process.env.NO_COLOR;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();

    // Restore stdout.isTTY and process.env.NO_COLOR to original state
    process.stdout.isTTY = originalIsTTY;
    if (originalNoColor === undefined) {
      delete process.env.NO_COLOR;
    } else {
      process.env.NO_COLOR = originalNoColor;
    }
  });

  describe("createLogger - Stream Output & Routing", () => {
    it("should route info level logs with prefix tag to process.stdout", () => {
      const logger = createLogger({ prefix: "app-service" });
      logger.info("service started successfully");

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const output = String(stdoutSpy.mock.calls[0]?.[0]);

      expect(output).toContain("app-service");
      // expect(output).toContain("service started successfully");
      // expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should route error level logs to process.stderr", () => {
      const logger = createLogger({ prefix: "app-service" });
      logger.error("connection error occurred");

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      const errOutput = String(stderrSpy.mock.calls[0]?.[0]);

      expect(errOutput).toContain("ERROR");
      expect(errOutput).toContain("connection error occurred");
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it("should respect level option and suppress debug logs when default level (info) is set", () => {
      const logger = createLogger();
      logger.debug("this debug message should be filtered out");

      expect(stdoutSpy).not.toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it("should emit debug and trace logs when logger level is set to trace", () => {
      const logger = createLogger({ level: "trace" });
      logger.trace("trace message");
      logger.debug("debug message");

      expect(stdoutSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("createLogger - Color Support & Formatting Selection", () => {
    it.each([
      {
        isTTY: true,
        noColor: undefined,
        colorize: undefined,
        expectedAnsi: true,
        desc: "stdout is TTY and NO_COLOR is not set",
      },
      {
        isTTY: false,
        noColor: undefined,
        colorize: undefined,
        expectedAnsi: false,
        desc: "stdout is not TTY",
      },
      {
        isTTY: true,
        noColor: "1",
        colorize: undefined,
        expectedAnsi: false,
        desc: "NO_COLOR is set even on TTY",
      },
      {
        isTTY: false,
        noColor: "1",
        colorize: true,
        expectedAnsi: true,
        desc: "colorize: true override forces ANSI output",
      },
      {
        isTTY: true,
        noColor: undefined,
        colorize: false,
        expectedAnsi: false,
        desc: "colorize: false override suppresses ANSI output",
      },
    ])(
      "should determine ANSI formatting correctly when $desc",
      ({ isTTY, noColor, colorize, expectedAnsi }) => {
        process.stdout.isTTY = isTTY;
        if (noColor === undefined) {
          delete process.env.NO_COLOR;
        } else {
          process.env.NO_COLOR = noColor;
        }

        const logger = createLogger({ colorize });
        logger.info("test message");

        const output = String(stdoutSpy.mock.calls[0]?.[0]);
        if (expectedAnsi) {
          expect(output).toMatch(/\x1b\[/);
        } else {
          expect(output).not.toMatch(/\x1b\[/);
        }
      },
    );
  });

  describe("getDefaultLogger", () => {
    it("should return the same singleton Logger instance across multiple calls", () => {
      const firstInstance = getDefaultLogger();
      const secondInstance = getDefaultLogger();

      expect(firstInstance).toBeDefined();
      expect(firstInstance).toBe(secondInstance);
    });
  });
});
