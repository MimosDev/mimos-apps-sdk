// Backend exports (for MCP servers / Node.js)
export { MimosAnalytics } from "./client";
export { ToolCallTracker } from "./tracker";

// Frontend exports (for browser / React Native / mobile)
export { MimosFrontendAnalytics } from "./frontend-client";

// Backend type exports
export type {
  MimosAnalyticsConfig,
  ToolCallStatus,
  ToolErrorType,
  ToolCallPayload,
  ToolErrorPayload,
  MetricsRequest,
  SuccessResponse,
  ErrorResponse,
  TrackToolCallOptions,
  TrackedCallResult,
} from "./types";

// Frontend type exports
export type {
  MimosFrontendConfig,
  FrontendEventType,
  ButtonClickPayload,
  MotionSwipePayload,
  MotionScrollPayload,
  SessionStartPayload,
  SessionEndPayload,
  ElementFocusPayload,
  AppLoadSuccessPayload,
  AppLoadErrorPayload,
  FrontendPayload,
} from "./frontend-types";
