/**
 * Tests: WebhookDeliveryService — WEBHOOK_WORKER_CONCURRENCY validation (#2000)
 *
 * A malformed WEBHOOK_WORKER_CONCURRENCY must fail with an error that names
 * the misconfigured env var, not WorkerPool's generic concurrency error.
 */

// Disable Redis-backed rate limiting (no REDIS_URL → fail-open).
delete process.env.REDIS_URL;

import { describe, it, expect, afterEach } from "vitest";
import {
  WebhookDeliveryService,
  parseWorkerConcurrency,
} from "../webhookDeliveryService";

const ORIGINAL = process.env.WEBHOOK_WORKER_CONCURRENCY;

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.WEBHOOK_WORKER_CONCURRENCY;
  else process.env.WEBHOOK_WORKER_CONCURRENCY = ORIGINAL;
});

describe("WebhookDeliveryService — WEBHOOK_WORKER_CONCURRENCY", () => {
  it("throws a clear error naming the env var for a non-numeric value", () => {
    process.env.WEBHOOK_WORKER_CONCURRENCY = "not-a-number";
    expect(() => new WebhookDeliveryService()).toThrow(
      /WEBHOOK_WORKER_CONCURRENCY must be a positive integer/
    );
  });

  it.each(["0", "-3", "2.5", "10abc"])(
    "rejects invalid value %s with the clear error",
    (value) => {
      expect(() => parseWorkerConcurrency(value)).toThrow(
        /WEBHOOK_WORKER_CONCURRENCY must be a positive integer/
      );
    }
  );

  it("constructs successfully with a valid value", () => {
    process.env.WEBHOOK_WORKER_CONCURRENCY = "4";
    expect(() => new WebhookDeliveryService()).not.toThrow();
  });

  it("defaults to 10 when unset or empty", () => {
    expect(parseWorkerConcurrency(undefined)).toBe(10);
    expect(parseWorkerConcurrency("")).toBe(10);
  });

  it("parses a valid positive integer", () => {
    expect(parseWorkerConcurrency("25")).toBe(25);
  });
});
