"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolCallTracker = void 0;
/**
 * Generate a unique call ID
 */
function generateCallId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
/**
 * Utility class for automatically tracking tool calls with timing
 */
class ToolCallTracker {
    constructor(analytics) {
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
    async track(toolName, fn, options) {
        const callId = options?.callId || generateCallId();
        const parametersStr = options?.parameters
            ? JSON.stringify(options.parameters)
            : undefined;
        const startTime = Date.now();
        try {
            const result = await fn();
            const durationMs = Date.now() - startTime;
            // Calculate response size if result is serializable
            let responseSizeBytes;
            try {
                responseSizeBytes = JSON.stringify(result).length;
            }
            catch {
                // Result not serializable, skip size tracking
            }
            // Track success (fire and forget)
            this.analytics
                .trackSuccess(toolName, durationMs, {
                callId,
                parameters: parametersStr,
                responseSizeBytes,
            })
                .catch(() => { });
            return result;
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            // Track error (fire and forget)
            this.analytics
                .trackError(toolName, error, {
                callId,
                parameters: parametersStr,
                errorType: options?.errorType || this.inferErrorType(error),
            })
                .catch(() => { });
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
    async trackWithMetadata(toolName, fn, options) {
        const callId = options?.callId || generateCallId();
        const parametersStr = options?.parameters
            ? JSON.stringify(options.parameters)
            : undefined;
        const startTime = Date.now();
        try {
            const result = await fn();
            const durationMs = Date.now() - startTime;
            let responseSizeBytes;
            try {
                responseSizeBytes = JSON.stringify(result).length;
            }
            catch {
                // Result not serializable
            }
            this.analytics
                .trackSuccess(toolName, durationMs, {
                callId,
                parameters: parametersStr,
                responseSizeBytes,
            })
                .catch(() => { });
            return { result, durationMs, callId };
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            this.analytics
                .trackError(toolName, error, {
                callId,
                parameters: parametersStr,
                errorType: options?.errorType || this.inferErrorType(error),
            })
                .catch(() => { });
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
    wrap(toolName, fn, options) {
        return async (...args) => {
            return this.track(toolName, () => fn(...args), {
                parameters: args.length === 1 ? args[0] : args,
                errorType: options?.errorType,
            });
        };
    }
    /**
     * Infer error type from the error object
     */
    inferErrorType(error) {
        if (!(error instanceof Error))
            return "unknown";
        const message = error.message.toLowerCase();
        const name = error.name.toLowerCase();
        if (name.includes("timeout") ||
            message.includes("timeout") ||
            message.includes("timed out")) {
            return "timeout";
        }
        if (name.includes("validation") ||
            message.includes("invalid") ||
            message.includes("required")) {
            return "validation";
        }
        if (message.includes("rate limit") ||
            message.includes("too many requests") ||
            message.includes("429")) {
            return "rate_limit";
        }
        if (message.includes("network") ||
            message.includes("fetch") ||
            message.includes("econnrefused")) {
            return "external";
        }
        return "internal";
    }
}
exports.ToolCallTracker = ToolCallTracker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhY2tlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy90cmFja2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUdBOztHQUVHO0FBQ0gsU0FBUyxjQUFjO0lBQ3JCLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDeEUsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxlQUFlO0lBRzFCLFlBQVksU0FBeUI7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNILEtBQUssQ0FBQyxLQUFLLENBQ1QsUUFBZ0IsRUFDaEIsRUFBb0IsRUFDcEIsT0FJQztRQUVELE1BQU0sTUFBTSxHQUFHLE9BQU8sRUFBRSxNQUFNLElBQUksY0FBYyxFQUFFLENBQUM7UUFDbkQsTUFBTSxhQUFhLEdBQUcsT0FBTyxFQUFFLFVBQVU7WUFDdkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQztZQUNwQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQ2QsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRTdCLElBQUksQ0FBQztZQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sRUFBRSxFQUFFLENBQUM7WUFDMUIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQztZQUUxQyxvREFBb0Q7WUFDcEQsSUFBSSxpQkFBcUMsQ0FBQztZQUMxQyxJQUFJLENBQUM7Z0JBQ0gsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDcEQsQ0FBQztZ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QUFDO1lBQ0QsT0FBTyxZQUFZLENBQUM7UUFDdEIsQ0FBQztRQUNELElBQ0UsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDM0IsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7WUFDekIsT0FBTyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsRUFDaEMsQ0FBQztZQUNELE9BQU8sVUFBVSxDQUFDO1FBQ3BCLENBQUM7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUEzTUQsMENBMk1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWltb3NBbmFseXRpY3MgfSBmcm9tIFwiLi9jbGllbnRcIjtcbmltcG9ydCB7IFRvb2xFcnJvclR5cGUsIFRyYWNrZWRDYWxsUmVzdWx0IH0gZnJvbSBcIi4vdHlwZXNcIjtcblxuLyoqXG4gKiBHZW5lcmF0ZSBhIHVuaXF1ZSBjYWxsIElEXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlQ2FsbElkKCk6IHN0cmluZyB7XG4gIHJldHVybiBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxMSl9YDtcbn1cblxuLyoqXG4gKiBVdGlsaXR5IGNsYXNzIGZvciBhdXRvbWF0aWNhbGx5IHRyYWNraW5nIHRvb2wgY2FsbHMgd2l0aCB0aW1pbmdcbiAqL1xuZXhwb3J0IGNsYXNzIFRvb2xDYWxsVHJhY2tlciB7XG4gIHByaXZhdGUgYW5hbHl0aWNzOiBNaW1vc0FuYWx5dGljcztcblxuICBjb25zdHJ1Y3RvcihhbmFseXRpY3M6IE1pbW9zQW5hbHl0aWNzKSB7XG4gICAgdGhpcy5hbmFseXRpY3MgPSBhbmFseXRpY3M7XG4gIH1cblxuICAvKipcbiAgICogVHJhY2sgYSB0b29sIGNhbGwgYnkgd3JhcHBpbmcgdGhlIGV4ZWN1dGlvbiBmdW5jdGlvbi5cbiAgICogQXV0b21hdGljYWxseSBtZWFzdXJlcyBkdXJhdGlvbiBhbmQgcmVwb3J0cyBzdWNjZXNzL2Vycm9yLlxuICAgKlxuICAgKiBAcGFyYW0gdG9vbE5hbWUgLSBOYW1lIG9mIHRoZSB0b29sIGJlaW5nIGNhbGxlZFxuICAgKiBAcGFyYW0gZm4gLSBBc3luYyBmdW5jdGlvbiB0byBleGVjdXRlXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gT3B0aW9uYWwgdHJhY2tpbmcgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBmdW5jdGlvbiBleGVjdXRpb25cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCByZXN1bHQgPSBhd2FpdCB0cmFja2VyLnRyYWNrKFwic2VhcmNoX2RhdGFiYXNlXCIsIGFzeW5jICgpID0+IHtcbiAgICogICByZXR1cm4gYXdhaXQgZGF0YWJhc2Uuc2VhcmNoKHF1ZXJ5KTtcbiAgICogfSwgeyBwYXJhbWV0ZXJzOiB7IHF1ZXJ5OiBcInRlc3RcIiB9IH0pO1xuICAgKiBgYGBcbiAgICovXG4gIGFzeW5jIHRyYWNrPFQ+KFxuICAgIHRvb2xOYW1lOiBzdHJpbmcsXG4gICAgZm46ICgpID0+IFByb21pc2U8VD4sXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGNhbGxJZD86IHN0cmluZztcbiAgICAgIHBhcmFtZXRlcnM/OiB1bmtub3duO1xuICAgICAgZXJyb3JUeXBlPzogVG9vbEVycm9yVHlwZTtcbiAgICB9XG4gICk6IFByb21pc2U8VD4ge1xuICAgIGNvbnN0IGNhbGxJZCA9IG9wdGlvbnM/LmNhbGxJZCB8fCBnZW5lcmF0ZUNhbGxJZCgpO1xuICAgIGNvbnN0IHBhcmFtZXRlcnNTdHIgPSBvcHRpb25zPy5wYXJhbWV0ZXJzXG4gICAgICA/IEpTT04uc3RyaW5naWZ5KG9wdGlvbnMucGFyYW1ldGVycylcbiAgICAgIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgZm4oKTtcbiAgICAgIGNvbnN0IGR1cmF0aW9uTXMgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICAvLyBDYWxjdWxhdGUgcmVzcG9uc2Ugc2l6ZSBpZiByZXN1bHQgaXMgc2VyaWFsaXphYmxlXG4gICAgICBsZXQgcmVzcG9uc2VTaXplQnl0ZXM6IG51bWJlciB8IHVuZGVmaW5lZDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3BvbnNlU2l6ZUJ5dGVzID0gSlNPTi5zdHJpbmdpZnkocmVzdWx0KS5sZW5ndGg7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUmVzdWx0IG5vdCBzZXJpYWxpemFibGUsIHNraXAgc2l6ZSB0cmFja2luZ1xuICAgICAgfVxuXG4gICAgICAvLyBUcmFjayBzdWNjZXNzIChmaXJlIGFuZCBmb3JnZXQpXG4gICAgICB0aGlzLmFuYWx5dGljc1xuICAgICAgICAudHJhY2tTdWNjZXNzKHRvb2xOYW1lLCBkdXJhdGlvbk1zLCB7XG4gICAgICAgICAgY2FsbElkLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNTdHIsXG4gICAgICAgICAgcmVzcG9uc2VTaXplQnl0ZXMsXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG5cbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uTXMgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICAvLyBUcmFjayBlcnJvciAoZmlyZSBhbmQgZm9yZ2V0KVxuICAgICAgdGhpcy5hbmFseXRpY3NcbiAgICAgICAgLnRyYWNrRXJyb3IodG9vbE5hbWUsIGVycm9yIGFzIEVycm9yLCB7XG4gICAgICAgICAgY2FsbElkLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNTdHIsXG4gICAgICAgICAgZXJyb3JUeXBlOiBvcHRpb25zPy5lcnJvclR5cGUgfHwgdGhpcy5pbmZlckVycm9yVHlwZShlcnJvciksXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG5cbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFjayBhIHRvb2wgY2FsbCBhbmQgcmV0dXJuIGFkZGl0aW9uYWwgbWV0YWRhdGEuXG4gICAqIFVzZSB0aGlzIHdoZW4geW91IG5lZWQgYWNjZXNzIHRvIHRoZSBjYWxsIElEIGFuZCBkdXJhdGlvbi5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB7IHJlc3VsdCwgZHVyYXRpb25NcywgY2FsbElkIH0gPSBhd2FpdCB0cmFja2VyLnRyYWNrV2l0aE1ldGFkYXRhKFxuICAgKiAgIFwic2VhcmNoX2RhdGFiYXNlXCIsXG4gICAqICAgYXN5bmMgKCkgPT4gYXdhaXQgZGF0YWJhc2Uuc2VhcmNoKHF1ZXJ5KVxuICAgKiApO1xuICAgKiBjb25zb2xlLmxvZyhgQ2FsbCAke2NhbGxJZH0gdG9vayAke2R1cmF0aW9uTXN9bXNgKTtcbiAgICogYGBgXG4gICAqL1xuICBhc3luYyB0cmFja1dpdGhNZXRhZGF0YTxUPihcbiAgICB0b29sTmFtZTogc3RyaW5nLFxuICAgIGZuOiAoKSA9PiBQcm9taXNlPFQ+LFxuICAgIG9wdGlvbnM/OiB7XG4gICAgICBjYWxsSWQ/OiBzdHJpbmc7XG4gICAgICBwYXJhbWV0ZXJzPzogdW5rbm93bjtcbiAgICAgIGVycm9yVHlwZT86IFRvb2xFcnJvclR5cGU7XG4gICAgfVxuICApOiBQcm9taXNlPFRyYWNrZWRDYWxsUmVzdWx0PFQ+PiB7XG4gICAgY29uc3QgY2FsbElkID0gb3B0aW9ucz8uY2FsbElkIHx8IGdlbmVyYXRlQ2FsbElkKCk7XG4gICAgY29uc3QgcGFyYW1ldGVyc1N0ciA9IG9wdGlvbnM/LnBhcmFtZXRlcnNcbiAgICAgID8gSlNPTi5zdHJpbmdpZnkob3B0aW9ucy5wYXJhbWV0ZXJzKVxuICAgICAgOiB1bmRlZmluZWQ7XG4gICAgY29uc3Qgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBmbigpO1xuICAgICAgY29uc3QgZHVyYXRpb25NcyA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG5cbiAgICAgIGxldCByZXNwb25zZVNpemVCeXRlczogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzcG9uc2VTaXplQnl0ZXMgPSBKU09OLnN0cmluZ2lmeShyZXN1bHQpLmxlbmd0aDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBSZXN1bHQgbm90IHNlcmlhbGl6YWJsZVxuICAgICAgfVxuXG4gICAgICB0aGlzLmFuYWx5dGljc1xuICAgICAgICAudHJhY2tTdWNjZXNzKHRvb2xOYW1lLCBkdXJhdGlvbk1zLCB7XG4gICAgICAgICAgY2FsbElkLFxuICAgICAgICAgIHBhcmFtZXRlcnM6IHBhcmFtZXRlcnNTdHIsXG4gICAgICAgICAgcmVzcG9uc2VTaXplQnl0ZXMsXG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoKSA9PiB7fSk7XG5cbiAgICAgIHJldHVybiB7IHJlc3VsdCwgZHVyYXRpb25NcywgY2FsbElkIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uTXMgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuXG4gICAgICB0aGlzLmFuYWx5dGljc1xuICAgICAgICAudHJhY2tFcnJvcih0b29sTmFtZSwgZXJyb3IgYXMgRXJyb3IsIHtcbiAgICAgICAgICBjYWxsSWQsXG4gICAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVyc1N0cixcbiAgICAgICAgICBlcnJvclR5cGU6IG9wdGlvbnM/LmVycm9yVHlwZSB8fCB0aGlzLmluZmVyRXJyb3JUeXBlKGVycm9yKSxcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcblxuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIHdyYXBwZWQgdmVyc2lvbiBvZiBhIHRvb2wgZnVuY3Rpb24gdGhhdCBhdXRvbWF0aWNhbGx5IHRyYWNrcyBjYWxscy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCB0cmFja2VkU2VhcmNoID0gdHJhY2tlci53cmFwKFwic2VhcmNoX2RhdGFiYXNlXCIsIHNlYXJjaERhdGFiYXNlKTtcbiAgICogY29uc3QgcmVzdWx0ID0gYXdhaXQgdHJhY2tlZFNlYXJjaCh7IHF1ZXJ5OiBcInRlc3RcIiB9KTtcbiAgICogYGBgXG4gICAqL1xuICB3cmFwPFRBcmdzIGV4dGVuZHMgdW5rbm93bltdLCBUUmVzdWx0PihcbiAgICB0b29sTmFtZTogc3RyaW5nLFxuICAgIGZuOiAoLi4uYXJnczogVEFyZ3MpID0+IFByb21pc2U8VFJlc3VsdD4sXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGVycm9yVHlwZT86IFRvb2xFcnJvclR5cGU7XG4gICAgfVxuICApOiAoLi4uYXJnczogVEFyZ3MpID0+IFByb21pc2U8VFJlc3VsdD4ge1xuICAgIHJldHVybiBhc3luYyAoLi4uYXJnczogVEFyZ3MpOiBQcm9taXNlPFRSZXN1bHQ+ID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnRyYWNrKHRvb2xOYW1lLCAoKSA9PiBmbiguLi5hcmdzKSwge1xuICAgICAgICBwYXJhbWV0ZXJzOiBhcmdzLmxlbmd0aCA9PT0gMSA/IGFyZ3NbMF0gOiBhcmdzLFxuICAgICAgICBlcnJvclR5cGU6IG9wdGlvbnM/LmVycm9yVHlwZSxcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogSW5mZXIgZXJyb3IgdHlwZSBmcm9tIHRoZSBlcnJvciBvYmplY3RcbiAgICovXG4gIHByaXZhdGUgaW5mZXJFcnJvclR5cGUoZXJyb3I6IHVua25vd24pOiBUb29sRXJyb3JUeXBlIHtcbiAgICBpZiAoIShlcnJvciBpbnN0YW5jZW9mIEVycm9yKSkgcmV0dXJuIFwidW5rbm93blwiO1xuXG4gICAgY29uc3QgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBuYW1lID0gZXJyb3IubmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKFxuICAgICAgbmFtZS5pbmNsdWRlcyhcInRpbWVvdXRcIikgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoXCJ0aW1lb3V0XCIpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKFwidGltZWQgb3V0XCIpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJ0aW1lb3V0XCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIG5hbWUuaW5jbHVkZXMoXCJ2YWxpZGF0aW9uXCIpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKFwiaW52YWxpZFwiKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcyhcInJlcXVpcmVkXCIpXG4gICAgKSB7XG4gICAgICByZXR1cm4gXCJ2YWxpZGF0aW9uXCI7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoXCJyYXRlIGxpbWl0XCIpIHx8XG4gICAgICBtZXNzYWdlLmluY2x1ZGVzKFwidG9vIG1hbnkgcmVxdWVzdHNcIikgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoXCI0MjlcIilcbiAgICApIHtcbiAgICAgIHJldHVybiBcInJhdGVfbGltaXRcIjtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcyhcIm5ldHdvcmtcIikgfHxcbiAgICAgIG1lc3NhZ2UuaW5jbHVkZXMoXCJmZXRjaFwiKSB8fFxuICAgICAgbWVzc2FnZS5pbmNsdWRlcyhcImVjb25ucmVmdXNlZFwiKVxuICAgICkge1xuICAgICAgcmV0dXJuIFwiZXh0ZXJuYWxcIjtcbiAgICB9XG5cbiAgICByZXR1cm4gXCJpbnRlcm5hbFwiO1xuICB9XG59XG4iXX0=