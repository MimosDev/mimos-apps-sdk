/**
 * Configuration options for the MimosAnalytics client
 */
export interface MimosAnalyticsConfig {
  /** Base URL of the analytics service (e.g., "http://localhost:8080") */
  baseUrl: string;
  /** Anonymous project identifier */
  projectId: string;
  /** API key for authentication */
  apiKey: string;
  /** Optional timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Optional flag to disable analytics (useful for development) */
  disabled?: boolean;
}

/**
 * Valid status values for tool calls
 */
export type ToolCallStatus = "success" | "error";

/**
 * Valid error type categories
 */
export type ToolErrorType =
  | "validation"
  | "timeout"
  | "internal"
  | "external"
  | "rate_limit"
  | "unknown";

/**
 * Payload for tool_call events
 */
export interface ToolCallPayload {
  /** Name of the MCP tool being called */
  tool_name: string;
  /** Optional unique identifier for correlation */
  call_id?: string;
  /** Duration of the call in milliseconds */
  duration_ms: number;
  /** Status of the call */
  status: ToolCallStatus;
  /** Raw parameters passed to the tool (JSON string) */
  parameters?: string;
  /** Size of the response in bytes */
  response_size_bytes?: number;
  /** Unix timestamp in milliseconds */
  timestamp_ms: number;
}

/**
 * Payload for tool_error events
 */
export interface ToolErrorPayload {
  /** Name of the MCP tool that errored */
  tool_name: string;
  /** Optional unique identifier for correlation */
  call_id?: string;
  /** Error code or type name */
  error_code: string;
  /** Human-readable error message */
  error_message: string;
  /** Category of the error */
  error_type: ToolErrorType;
  /** Raw parameters that caused the error (JSON string) */
  parameters?: string;
  /** Stack trace if available */
  stack_trace?: string;
  /** Unix timestamp in milliseconds */
  timestamp_ms: number;
}

/**
 * Generic metrics request structure
 */
export interface MetricsRequest {
  event_type: "tool_call" | "tool_error";
  metric_value: string;
}

/**
 * Success response from the analytics service
 */
export interface SuccessResponse {
  status: "accepted";
  message: string;
}

/**
 * Error response from the analytics service
 */
export interface ErrorResponse {
  error: string;
}

/**
 * Options for tracking a tool call
 */
export interface TrackToolCallOptions {
  /** Name of the tool being called */
  toolName: string;
  /** Optional call ID for correlation (auto-generated if not provided) */
  callId?: string;
  /** Parameters passed to the tool (will be JSON stringified) */
  parameters?: unknown;
}

/**
 * Result of a tracked tool call
 */
export interface TrackedCallResult<T> {
  /** The result of the tool call */
  result: T;
  /** Duration in milliseconds */
  durationMs: number;
  /** The call ID used for tracking */
  callId: string;
}
