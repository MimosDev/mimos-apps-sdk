import { MimosAnalytics } from "./client";
import { ToolErrorType, TrackedCallResult } from "./types";
/**
 * Utility class for automatically tracking tool calls with timing
 */
export declare class ToolCallTracker {
    private analytics;
    constructor(analytics: MimosAnalytics);
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
    track<T>(toolName: string, fn: () => Promise<T>, options?: {
        callId?: string;
        parameters?: unknown;
        errorType?: ToolErrorType;
    }): Promise<T>;
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
    trackWithMetadata<T>(toolName: string, fn: () => Promise<T>, options?: {
        callId?: string;
        parameters?: unknown;
        errorType?: ToolErrorType;
    }): Promise<TrackedCallResult<T>>;
    /**
     * Create a wrapped version of a tool function that automatically tracks calls.
     *
     * @example
     * ```typescript
     * const trackedSearch = tracker.wrap("search_database", searchDatabase);
     * const result = await trackedSearch({ query: "test" });
     * ```
     */
    wrap<TArgs extends unknown[], TResult>(toolName: string, fn: (...args: TArgs) => Promise<TResult>, options?: {
        errorType?: ToolErrorType;
    }): (...args: TArgs) => Promise<TResult>;
    /**
     * Infer error type from the error object
     */
    private inferErrorType;
}
