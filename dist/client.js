"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimosAnalytics = void 0;
/**
 * Client for sending metrics to the Mimos App Analytics Service
 */
class MimosAnalytics {
    constructor(config) {
        this.config = {
            timeout: 5000,
            disabled: false,
            ...config,
        };
        // Normalize base URL (remove trailing slash)
        const baseUrl = this.config.baseUrl.replace(/\/$/, "");
        this.backendMetricsUrl = `${baseUrl}/v1/backend-metrics/write/`;
    }
    /**
     * Check if analytics is disabled
     */
    isDisabled() {
        return this.config.disabled;
    }
    /**
     * Send a tool_call metric
     */
    async trackToolCall(payload) {
        if (this.config.disabled)
            return;
        const request = {
            event_type: "tool_call",
            metric_value: JSON.stringify(payload),
        };
        await this.sendMetric(request);
    }
    /**
     * Send a tool_error metric
     */
    async trackToolError(payload) {
        if (this.config.disabled)
            return;
        const request = {
            event_type: "tool_error",
            metric_value: JSON.stringify(payload),
        };
        await this.sendMetric(request);
    }
    /**
     * Convenience method to track a successful tool call
     */
    async trackSuccess(toolName, durationMs, options) {
        await this.trackToolCall({
            tool_name: toolName,
            duration_ms: durationMs,
            status: "success",
            timestamp_ms: Date.now(),
            call_id: options?.callId,
            parameters: options?.parameters,
            response_size_bytes: options?.responseSizeBytes,
        });
    }
    /**
     * Convenience method to track a failed tool call
     */
    async trackError(toolName, error, options) {
        const errorMessage = error instanceof Error ? error.message : error;
        const errorCode = options?.errorCode ||
            (error instanceof Error ? error.constructor.name : "Error");
        const stackTrace = error instanceof Error ? error.stack : undefined;
        await this.trackToolError({
            tool_name: toolName,
            error_code: errorCode,
            error_message: errorMessage,
            error_type: options?.errorType || "unknown",
            timestamp_ms: Date.now(),
            call_id: options?.callId,
            parameters: options?.parameters,
            stack_trace: stackTrace,
        });
    }
    /**
     * Internal method to send metrics to the analytics service
     */
    async sendMetric(request) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        try {
            const response = await fetch(this.backendMetricsUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "anon-project-id": this.config.projectId,
                    "api-key": this.config.apiKey,
                },
                body: JSON.stringify(request),
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`[MimosAnalytics] Failed to send metric: ${response.status} ${errorBody}`);
            }
        }
        catch (error) {
            // Log but don't throw - analytics should never break the app
            if (error instanceof Error && error.name === "AbortError") {
                console.error("[MimosAnalytics] Request timed out");
            }
            else {
                console.error("[MimosAnalytics] Failed to send metric:", error);
            }
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
}
exports.MimosAnalytics = MimosAnalytics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFRQTs7R0FFRztBQUNILE1BQWEsY0FBYztJQUl6QixZQUFZLE1BQTRCO1FBQ3RDLElBQUksQ0FBQyxNQUFNLEdBQUc7WUFDWixPQUFPLEVBQUUsSUFBSTtZQUNiLFFBQVEsRUFBRSxLQUFLO1lBQ2YsR0FBRyxNQUFNO1NBQ1YsQ0FBQztRQUVGLDZDQUE2QztRQUM3QyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxpQkFBaUIsR0FBRyxHQUFHLE9BQU8sNEJBQTRCLENBQUM7SUFDbEUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDOUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUF3QjtRQUMxQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUTtZQUFFLE9BQU87UUFFakMsTUFBTSxPQUFPLEdBQW1CO1lBQzlCLFVBQVUsRUFBRSxXQUFXO1lBQ3ZCLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQztTQUN0QyxDQUFDO1FBRUYsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7T0FFRztJQUNILEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBeUI7UUFDNUMsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVE7WUFBRSxPQUFPO1FBRWpDLE1BQU0sT0FBTyxHQUFtQjtZQUM5QixVQUFVLEVBQUUsWUFBWTtZQUN4QixZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7U0FDdEMsQ0FB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QUFLLENBQUMsSUFBSSxLQUFLLFlBQVksRUFBRSxDQUFDO2dCQUMxRCxPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxDQUFDLENBQUM7WUFDdEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU8sQ0FBQyxLQUFLLENBQUMseUNBQXlDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEUsQ0FBQztRQUNILENBQUM7Z0JBQVMsQ0FBQztZQUNULFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMxQixDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBN0lELHdDQTZJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIE1pbW9zQW5hbHl0aWNzQ29uZmlnLFxuICBUb29sQ2FsbFBheWxvYWQsXG4gIFRvb2xFcnJvclBheWxvYWQsXG4gIE1ldHJpY3NSZXF1ZXN0LFxuICBUb29sRXJyb3JUeXBlLFxufSBmcm9tIFwiLi90eXBlc1wiO1xuXG4vKipcbiAqIENsaWVudCBmb3Igc2VuZGluZyBtZXRyaWNzIHRvIHRoZSBNaW1vcyBBcHAgQW5hbHl0aWNzIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGNsYXNzIE1pbW9zQW5hbHl0aWNzIHtcbiAgcHJpdmF0ZSBjb25maWc6IFJlcXVpcmVkPE1pbW9zQW5hbHl0aWNzQ29uZmlnPjtcbiAgcHJpdmF0ZSBiYWNrZW5kTWV0cmljc1VybDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTWltb3NBbmFseXRpY3NDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIHRpbWVvdXQ6IDUwMDAsXG4gICAgICBkaXNhYmxlZDogZmFsc2UsXG4gICAgICAuLi5jb25maWcsXG4gICAgfTtcblxuICAgIC8vIE5vcm1hbGl6ZSBiYXNlIFVSTCAocmVtb3ZlIHRyYWlsaW5nIHNsYXNoKVxuICAgIGNvbnN0IGJhc2VVcmwgPSB0aGlzLmNvbmZpZy5iYXNlVXJsLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTtcbiAgICB0aGlzLmJhY2tlbmRNZXRyaWNzVXJsID0gYCR7YmFzZVVybH0vdjEvYmFja2VuZC1tZXRyaWNzL3dyaXRlL2A7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYW5hbHl0aWNzIGlzIGRpc2FibGVkXG4gICAqL1xuICBpc0Rpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5kaXNhYmxlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgdG9vbF9jYWxsIG1ldHJpY1xuICAgKi9cbiAgYXN5bmMgdHJhY2tUb29sQ2FsbChwYXlsb2FkOiBUb29sQ2FsbFBheWxvYWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcuZGlzYWJsZWQpIHJldHVybjtcblxuICAgIGNvbnN0IHJlcXVlc3Q6IE1ldHJpY3NSZXF1ZXN0ID0ge1xuICAgICAgZXZlbnRfdHlwZTogXCJ0b29sX2NhbGxcIixcbiAgICAgIG1ldHJpY192YWx1ZTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZCksXG4gICAgfTtcblxuICAgIGF3YWl0IHRoaXMuc2VuZE1ldHJpYyhyZXF1ZXN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgdG9vbF9lcnJvciBtZXRyaWNcbiAgICovXG4gIGFzeW5jIHRyYWNrVG9vbEVycm9yKHBheWxvYWQ6IFRvb2xFcnJvclBheWxvYWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcuZGlzYWJsZWQpIHJldHVybjtcblxuICAgIGNvbnN0IHJlcXVlc3Q6IE1ldHJpY3NSZXF1ZXN0ID0ge1xuICAgICAgZXZlbnRfdHlwZTogXCJ0b29sX2Vycm9yXCIsXG4gICAgICBtZXRyaWNfdmFsdWU6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpLFxuICAgIH07XG5cbiAgICBhd2FpdCB0aGlzLnNlbmRNZXRyaWMocmVxdWVzdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIHRyYWNrIGEgc3VjY2Vzc2Z1bCB0b29sIGNhbGxcbiAgICovXG4gIGFzeW5jIHRyYWNrU3VjY2VzcyhcbiAgICB0b29sTmFtZTogc3RyaW5nLFxuICAgIGR1cmF0aW9uTXM6IG51bWJlcixcbiAgICBvcHRpb25zPzoge1xuICAgICAgY2FsbElkPzogc3RyaW5nO1xuICAgICAgcGFyYW1ldGVycz86IHN0cmluZztcbiAgICAgIHJlc3BvbnNlU2l6ZUJ5dGVzPzogbnVtYmVyO1xuICAgIH1cbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy50cmFja1Rvb2xDYWxsKHtcbiAgICAgIHRvb2xfbmFtZTogdG9vbE5hbWUsXG4gICAgICBkdXJhdGlvbl9tczogZHVyYXRpb25NcyxcbiAgICAgIHN0YXR1czogXCJzdWNjZXNzXCIsXG4gICAgICB0aW1lc3RhbXBfbXM6IERhdGUubm93KCksXG4gICAgICBjYWxsX2lkOiBvcHRpb25zPy5jYWxsSWQsXG4gICAgICBwYXJhbWV0ZXJzOiBvcHRpb25zPy5wYXJhbWV0ZXJzLFxuICAgICAgcmVzcG9uc2Vfc2l6ZV9ieXRlczogb3B0aW9ucz8ucmVzcG9uc2VTaXplQnl0ZXMsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIHRyYWNrIGEgZmFpbGVkIHRvb2wgY2FsbFxuICAgKi9cbiAgYXN5bmMgdHJhY2tFcnJvcihcbiAgICB0b29sTmFtZTogc3RyaW5nLFxuICAgIGVycm9yOiBFcnJvciB8IHN0cmluZyxcbiAgICBvcHRpb25zPzoge1xuICAgICAgY2FsbElkPzogc3RyaW5nO1xuICAgICAgcGFyYW1ldGVycz86IHN0cmluZztcbiAgICAgIGVycm9yVHlwZT86IFRvb2xFcnJvclR5cGU7XG4gICAgICBlcnJvckNvZGU/OiBzdHJpbmc7XG4gICAgfVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yO1xuICAgIGNvbnN0IGVycm9yQ29kZSA9XG4gICAgICBvcHRpb25zPy5lcnJvckNvZGUgfHxcbiAgICAgIChlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IuY29uc3RydWN0b3IubmFtZSA6IFwiRXJyb3JcIik7XG4gICAgY29uc3Qgc3RhY2tUcmFjZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5zdGFjayA6IHVuZGVmaW5lZDtcblxuICAgIGF3YWl0IHRoaXMudHJhY2tUb29sRXJyb3Ioe1xuICAgICAgdG9vbF9uYW1lOiB0b29sTmFtZSxcbiAgICAgIGVycm9yX2NvZGU6IGVycm9yQ29kZSxcbiAgICAgIGVycm9yX21lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgIGVycm9yX3R5cGU6IG9wdGlvbnM/LmVycm9yVHlwZSB8fCBcInVua25vd25cIixcbiAgICAgIHRpbWVzdGFtcF9tczogRGF0ZS5ub3coKSxcbiAgICAgIGNhbGxfaWQ6IG9wdGlvbnM/LmNhbGxJZCxcbiAgICAgIHBhcmFtZXRlcnM6IG9wdGlvbnM/LnBhcmFtZXRlcnMsXG4gICAgICBzdGFja190cmFjZTogc3RhY2tUcmFjZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBtZXRob2QgdG8gc2VuZCBtZXRyaWNzIHRvIHRoZSBhbmFseXRpY3Mgc2VydmljZVxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBzZW5kTWV0cmljKHJlcXVlc3Q6IE1ldHJpY3NSZXF1ZXN0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICBjb25zdCB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IGNvbnRyb2xsZXIuYWJvcnQoKSwgdGhpcy5jb25maWcudGltZW91dCk7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh0aGlzLmJhY2tlbmRNZXRyaWNzVXJsLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICBcImFub24tcHJvamVjdC1pZFwiOiB0aGlzLmNvbmZpZy5wcm9qZWN0SWQsXG4gICAgICAgICAgXCJhcGkta2V5XCI6IHRoaXMuY29uZmlnLmFwaUtleSxcbiAgICAgICAgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdCksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvckJvZHkgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtNaW1vc0FuYWx5dGljc10gRmFpbGVkIHRvIHNlbmQgbWV0cmljOiAke3Jlc3BvbnNlLnN0YXR1c30gJHtlcnJvckJvZHl9YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAvLyBMb2cgYnV0IGRvbid0IHRocm93IC0gYW5hbHl0aWNzIHNob3VsZCBuZXZlciBicmVhayB0aGUgYXBwXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiW01pbW9zQW5hbHl0aWNzXSBSZXF1ZXN0IHRpbWVkIG91dFwiKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbTWltb3NBbmFseXRpY3NdIEZhaWxlZCB0byBzZW5kIG1ldHJpYzpcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==