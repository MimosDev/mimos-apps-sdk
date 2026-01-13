import { MimosAnalytics } from "./client";
import { ToolErrorType, TrackedCallResult } from "./types";

/**
 * Generate a unique call ID
 */
function generateCallId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Utility class for automatically tracking tool calls with timing
 */
export class ToolCallTracker {
  private analytics: MimosAnalytics;

  constructor(analytics: MimosAnalytics) {
    this.analytics = analytics;
  }

  /**
   * Track a tool call by wrapping the execution function.
   * Automatically measures duration and reports success/error.
   *
   * @param toolName - Name of the tool being called
   * @param fn - Async function to execute
   * @param options - Optional tracking options
   * @returns The result of the function execution
   *
   * @example
   * ```typescript
   * const result = await tracker.track("search_database", async () => {
   *   return await database.search(query);
   * }, { parameters: { query: "test" } });
   * ```
   */
  async track<T>(
    toolName: string,
    fn: () => Promise<T>,
    options?: {
      callId?: string;
      parameters?: unknown;
      errorType?: ToolErrorType;
    }
  ): Promise<T> {
    const callId = options?.callId || generateCallId();
    const parametersStr = options?.parameters
      ? JSON.stringify(options.parameters)
      : undefined;
    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      // Calculate response size if result is serializable
      let responseSizeBytes: number | undefined;
      try {
        responseSizeBytes = JSON.stringify(result).length;
      } catch {
        // Result not serializable, skip size tracking
      }

      // Track success (fire and forget)
      this.analytics
        .trackSuccess(toolName, durationMs, {
          callId,
          parameters: parametersStr,
          responseSizeBytes,
        })
        .catch(() => {});

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      // Track error (fire and forget)
      this.analytics
        .trackError(toolName, error as Error, {
          callId,
          parameters: parametersStr,
          errorType: options?.errorType || this.inferErrorType(error),
        })
        .catch(() => {});

      throw error;
    }
  }

  /**
   * Track a tool call and return additional metadata.
   * Use this when you need access to the call ID and duration.
   *
   * @example
   * ```typescript
   * const { result, durationMs, callId } = await tracker.trackWithMetadata(
   *   "search_database",
   *   async () => await database.search(query)
   * );
   * console.log(`Call ${callId} took ${durationMs}ms`);
   * ```
   */
  async trackWithMetadata<T>(
    toolName: string,
    fn: () => Promise<T>,
    options?: {
      callId?: string;
      parameters?: unknown;
      errorType?: ToolErrorType;
    }
  ): Promise<TrackedCallResult<T>> {
    const callId = options?.callId || generateCallId();
    const parametersStr = options?.parameters
      ? JSON.stringify(options.parameters)
      : undefined;
    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      let responseSizeBytes: number | undefined;
      try {
        responseSizeBytes = JSON.stringify(result).length;
      } catch {
        // Result not serializable
      }

      this.analytics
        .trackSuccess(toolName, durationMs, {
          callId,
          parameters: parametersStr,
          responseSizeBytes,
        })
        .catch(() => {});

      return { result, durationMs, callId };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      this.analytics
        .trackError(toolName, error as Error, {
          callId,
          parameters: parametersStr,
          errorType: options?.errorType || this.inferErrorType(error),
        })
        .catch(() => {});

      throw error;
    }
  }

  /**
   * Create a wrapped version of a tool function that automatically tracks calls.
   *
   * @example
   * ```typescript
   * const trackedSearch = tracker.wrap("search_database", searchDatabase);
   * const result = await trackedSearch({ query: "test" });
   * ```
   */
  wrap<TArgs extends unknown[], TResult>(
    toolName: string,
    fn: (...args: TArgs) => Promise<TResult>,
    options?: {
      errorType?: ToolErrorType;
    }
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      return this.track(toolName, () => fn(...args), {
        parameters: args.length === 1 ? args[0] : args,
        errorType: options?.errorType,
      });
    };
  }

  /**
   * Infer error type from the error object
   */
  private inferErrorType(error: unknown): ToolErrorType {
    if (!(error instanceof Error)) return "unknown";

    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    if (
      name.includes("timeout") ||
      message.includes("timeout") ||
      message.includes("timed out")
    ) {
      return "timeout";
    }
    if (
      name.includes("validation") ||
      message.includes("invalid") ||
      message.includes("required")
    ) {
      return "validation";
    }
    if (
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("429")
    ) {
      return "rate_limit";
    }
    if (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("econnrefused")
    ) {
      return "external";
    }

    return "internal";
  }
}
