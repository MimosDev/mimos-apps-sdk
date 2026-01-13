import { MimosFrontendConfig, ButtonClickPayload, MotionSwipePayload, MotionScrollPayload, SessionStartPayload, SessionEndPayload, ElementFocusPayload, AppLoadSuccessPayload, AppLoadErrorPayload } from "./frontend-types";
/**
 * Client for sending frontend metrics to the Mimos App Analytics Service.
 * Use this in browser/React Native/mobile apps.
 */
export declare class MimosFrontendAnalytics {
    private config;
    private frontendMetricsUrl;
    private sessionId;
    private sessionStartTime;
    private screenHistory;
    private eventCount;
    constructor(config: MimosFrontendConfig);
    /**
     * Check if analytics is disabled
     */
    isDisabled(): boolean;
    /**
     * Start a new session. Call this when the app launches or user logs in.
     */
    startSession(payload: Omit<SessionStartPayload, "session_id"> & {
        session_id?: string;
    }): Promise<string>;
    /**
     * End the current session. Call this when the app closes or user logs out.
     */
    endSession(exitReason: SessionEndPayload["exit_reason"]): Promise<void>;
    /**
     * Get the current session ID
     */
    getSessionId(): string | null;
    /**
     * Track a button click
     */
    trackButtonClick(buttonId: string, screenName: string, options?: {
        buttonText?: string;
        x?: number;
        y?: number;
    }): Promise<void>;
    /**
     * Track a swipe gesture
     */
    trackSwipe(payload: MotionSwipePayload): Promise<void>;
    /**
     * Track a scroll event
     */
    trackScroll(payload: MotionScrollPayload): Promise<void>;
    /**
     * Track element focus (form field interaction)
     */
    trackElementFocus(payload: ElementFocusPayload): Promise<void>;
    /**
     * Track successful page/screen load
     */
    trackLoadSuccess(screenName: string, loadTimeMs: number, options?: {
        isColdStart?: boolean;
        networkType?: AppLoadSuccessPayload["network_type"];
        ttfbMs?: number;
        resourceCount?: number;
        cacheHit?: boolean;
    }): Promise<void>;
    /**
     * Track failed page/screen load
     */
    trackLoadError(screenName: string, error: Error | string, options?: {
        errorType?: AppLoadErrorPayload["error_type"];
        errorCode?: string;
        httpStatus?: number;
        retryCount?: number;
    }): Promise<void>;
    /**
     * Send a raw button_click event
     */
    sendButtonClick(payload: ButtonClickPayload): Promise<void>;
    /**
     * Send a raw session_start event
     */
    sendSessionStart(payload: SessionStartPayload): Promise<void>;
    /**
     * Send a raw session_end event
     */
    sendSessionEnd(payload: SessionEndPayload): Promise<void>;
    /**
     * Send a raw app_load_success event
     */
    sendAppLoadSuccess(payload: AppLoadSuccessPayload): Promise<void>;
    /**
     * Send a raw app_load_error event
     */
    sendAppLoadError(payload: AppLoadErrorPayload): Promise<void>;
    private generateSessionId;
    private updateScreenHistory;
    private sendMetric;
}
