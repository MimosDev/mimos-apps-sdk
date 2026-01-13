/**
 * Configuration options for the MimosFrontendAnalytics client
 */
export interface MimosFrontendConfig {
    /** Base URL of the analytics service (e.g., "http://localhost:8080") */
    baseUrl: string;
    /** Anonymous project identifier */
    projectId: string;
    /** Optional timeout in milliseconds (default: 5000) */
    timeout?: number;
    /** Optional flag to disable analytics (useful for development) */
    disabled?: boolean;
}
/**
 * Valid frontend event types
 */
export type FrontendEventType = "button_click" | "motion_swipe" | "motion_scroll" | "session_start" | "session_end" | "element_focus" | "app_load_success" | "app_load_error";
/**
 * Payload for button_click events
 */
export interface ButtonClickPayload {
    button_id: string;
    button_text?: string;
    screen_name: string;
    x_position?: number;
    y_position?: number;
    timestamp_ms: number;
}
/**
 * Payload for motion_swipe events
 */
export interface MotionSwipePayload {
    direction: "up" | "down" | "left" | "right";
    start_x: number;
    start_y: number;
    end_x: number;
    end_y: number;
    velocity?: number;
    duration_ms: number;
    screen_name: string;
}
/**
 * Payload for motion_scroll events
 */
export interface MotionScrollPayload {
    direction: "up" | "down";
    scroll_depth_px: number;
    scroll_depth_percent?: number;
    start_position: number;
    end_position: number;
    duration_ms: number;
    screen_name: string;
}
/**
 * Payload for session_start events
 */
export interface SessionStartPayload {
    session_id: string;
    device_type: "mobile" | "tablet" | "desktop";
    os_name: "ios" | "android" | "web";
    os_version: string;
    app_version: string;
    device_model?: string;
    screen_width?: number;
    screen_height?: number;
    locale?: string;
    timezone?: string;
}
/**
 * Payload for session_end events
 */
export interface SessionEndPayload {
    session_id: string;
    session_duration_ms: number;
    exit_reason: "user_exit" | "background" | "timeout" | "crash" | "logout";
    screens_visited: number;
    total_events?: number;
    last_screen?: string;
}
/**
 * Payload for element_focus events
 */
export interface ElementFocusPayload {
    element_id: string;
    element_type: "text_input" | "dropdown" | "checkbox" | "radio" | "textarea" | "search";
    screen_name: string;
    focus_duration_ms: number;
    had_interaction: boolean;
    field_name?: string;
}
/**
 * Payload for app_load_success events
 */
export interface AppLoadSuccessPayload {
    screen_name: string;
    load_time_ms: number;
    is_cold_start: boolean;
    network_type?: "wifi" | "cellular" | "offline" | "unknown";
    ttfb_ms?: number;
    resource_count?: number;
    cache_hit?: boolean;
}
/**
 * Payload for app_load_error events
 */
export interface AppLoadErrorPayload {
    screen_name: string;
    error_code: string;
    error_message: string;
    error_type: "network" | "timeout" | "server" | "parse" | "unknown";
    http_status?: number;
    retry_count?: number;
    stack_trace?: string;
}
/**
 * Union type of all frontend payloads
 */
export type FrontendPayload = ButtonClickPayload | MotionSwipePayload | MotionScrollPayload | SessionStartPayload | SessionEndPayload | ElementFocusPayload | AppLoadSuccessPayload | AppLoadErrorPayload;
