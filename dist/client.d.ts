import { MimosAnalyticsConfig, ToolCallPayload, ToolErrorPayload, ToolErrorType } from "./types";
/**
 * Client for sending metrics to the Mimos App Analytics Service
 */
export declare class MimosAnalytics {
    private config;
    private backendMetricsUrl;
    constructor(config: MimosAnalyticsConfig);
    /**
     * Check if analytics is disabled
     */
    isDisabled(): boolean;
    /**
     * Send a tool_call metric
     */
    trackToolCall(payload: ToolCallPayload): Promise<void>;
    /**
     * Send a tool_error metric
     */
    trackToolError(payload: ToolErrorPayload): Promise<void>;
    /**
     * Convenience method to track a successful tool call
     */
    trackSuccess(toolName: string, durationMs: number, options?: {
        callId?: string;
        parameters?: string;
        responseSizeBytes?: number;
    }): Promise<void>;
    /**
     * Convenience method to track a failed tool call
     */
    trackError(toolName: string, error: Error | string, options?: {
        callId?: string;
        parameters?: string;
        errorType?: ToolErrorType;
        errorCode?: string;
    }): Promise<void>;
    /**
     * Internal method to send metrics to the analytics service
     */
    private sendMetric;
}
