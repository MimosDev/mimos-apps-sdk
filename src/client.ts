import {
  MimosAnalyticsConfig,
  ToolCallPayload,
  ToolErrorPayload,
  MetricsRequest,
  ToolErrorType,
} from "./types";

/**
 * Client for sending metrics to the Mimos App Analytics Service
 */
export class MimosAnalytics {
  private config: Required<MimosAnalyticsConfig>;
  private backendMetricsUrl: string;

  constructor(config: MimosAnalyticsConfig) {
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
  isDisabled(): boolean {
    return this.config.disabled;
  }

  /**
   * Send a tool_call metric
   */
  async trackToolCall(payload: ToolCallPayload): Promise<void> {
    if (this.config.disabled) return;

    const request: MetricsRequest = {
      event_type: "tool_call",
      metric_value: JSON.stringify(payload),
    };

    await this.sendMetric(request);
  }

  /**
   * Send a tool_error metric
   */
  async trackToolError(payload: ToolErrorPayload): Promise<void> {
    if (this.config.disabled) return;

    const request: MetricsRequest = {
      event_type: "tool_error",
      metric_value: JSON.stringify(payload),
    };

    await this.sendMetric(request);
  }

  /**
   * Convenience method to track a successful tool call
   */
  async trackSuccess(
    toolName: string,
    durationMs: number,
    options?: {
      callId?: string;
      parameters?: string;
      responseSizeBytes?: number;
    }
  ): Promise<void> {
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
  async trackError(
    toolName: string,
    error: Error | string,
    options?: {
      callId?: string;
      parameters?: string;
      errorType?: ToolErrorType;
      errorCode?: string;
    }
  ): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorCode =
      options?.errorCode ||
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
  private async sendMetric(request: MetricsRequest): Promise<void> {
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
        console.error(
          `[MimosAnalytics] Failed to send metric: ${response.status} ${errorBody}`
        );
      }
    } catch (error) {
      // Log but don't throw - analytics should never break the app
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[MimosAnalytics] Request timed out");
      } else {
        console.error("[MimosAnalytics] Failed to send metric:", error);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
