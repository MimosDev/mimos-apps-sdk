import {
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
} from "./frontend-types";

/**
 * Client for sending frontend metrics to the Mimos App Analytics Service.
 * Use this in browser/React Native/mobile apps.
 */
export class MimosFrontendAnalytics {
  private config: Required<MimosFrontendConfig>;
  private frontendMetricsUrl: string;
  private sessionId: string | null = null;
  private sessionStartTime: number | null = null;
  private screenHistory: string[] = [];
  private eventCount: number = 0;

  constructor(config: MimosFrontendConfig) {
    this.config = {
      timeout: 5000,
      disabled: false,
      ...config,
    };

    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    this.frontendMetricsUrl = `${baseUrl}/v1/frontend-metrics/write/`;
  }

  /**
   * Check if analytics is disabled
   */
  isDisabled(): boolean {
    return this.config.disabled;
  }

  // ============================================================
  // Session Management
  // ============================================================

  /**
   * Start a new session. Call this when the app launches or user logs in.
   */
  async startSession(payload: Omit<SessionStartPayload, "session_id"> & { session_id?: string }): Promise<string> {
    const sessionId = payload.session_id || this.generateSessionId();
    this.sessionId = sessionId;
    this.sessionStartTime = Date.now();
    this.screenHistory = [];
    this.eventCount = 0;

    await this.sendMetric("session_start", {
      ...payload,
      session_id: sessionId,
    });

    return sessionId;
  }

  /**
   * End the current session. Call this when the app closes or user logs out.
   */
  async endSession(exitReason: SessionEndPayload["exit_reason"]): Promise<void> {
    if (!this.sessionId || !this.sessionStartTime) {
      console.warn("[MimosFrontendAnalytics] No active session to end");
      return;
    }

    const payload: SessionEndPayload = {
      session_id: this.sessionId,
      session_duration_ms: Date.now() - this.sessionStartTime,
      exit_reason: exitReason,
      screens_visited: this.screenHistory.length,
      total_events: this.eventCount,
      last_screen: this.screenHistory[this.screenHistory.length - 1],
    };

    await this.sendMetric("session_end", payload);

    this.sessionId = null;
    this.sessionStartTime = null;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  // ============================================================
  // User Interaction Events
  // ============================================================

  /**
   * Track a button click
   */
  async trackButtonClick(
    buttonId: string,
    screenName: string,
    options?: {
      buttonText?: string;
      x?: number;
      y?: number;
    }
  ): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(screenName);

    await this.sendMetric("button_click", {
      button_id: buttonId,
      screen_name: screenName,
      button_text: options?.buttonText,
      x_position: options?.x,
      y_position: options?.y,
      timestamp_ms: Date.now(),
    });
  }

  /**
   * Track a swipe gesture
   */
  async trackSwipe(payload: MotionSwipePayload): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(payload.screen_name);
    await this.sendMetric("motion_swipe", payload);
  }

  /**
   * Track a scroll event
   */
  async trackScroll(payload: MotionScrollPayload): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(payload.screen_name);
    await this.sendMetric("motion_scroll", payload);
  }

  /**
   * Track element focus (form field interaction)
   */
  async trackElementFocus(payload: ElementFocusPayload): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(payload.screen_name);
    await this.sendMetric("element_focus", payload);
  }

  // ============================================================
  // Page/Screen Load Events
  // ============================================================

  /**
   * Track successful page/screen load
   */
  async trackLoadSuccess(
    screenName: string,
    loadTimeMs: number,
    options?: {
      isColdStart?: boolean;
      networkType?: AppLoadSuccessPayload["network_type"];
      ttfbMs?: number;
      resourceCount?: number;
      cacheHit?: boolean;
    }
  ): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(screenName);

    await this.sendMetric("app_load_success", {
      screen_name: screenName,
      load_time_ms: loadTimeMs,
      is_cold_start: options?.isColdStart ?? false,
      network_type: options?.networkType,
      ttfb_ms: options?.ttfbMs,
      resource_count: options?.resourceCount,
      cache_hit: options?.cacheHit,
    });
  }

  /**
   * Track failed page/screen load
   */
  async trackLoadError(
    screenName: string,
    error: Error | string,
    options?: {
      errorType?: AppLoadErrorPayload["error_type"];
      errorCode?: string;
      httpStatus?: number;
      retryCount?: number;
    }
  ): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(screenName);

    const errorMessage = error instanceof Error ? error.message : error;
    const errorCode = options?.errorCode || (error instanceof Error ? error.name : "Error");
    const stackTrace = error instanceof Error ? error.stack : undefined;

    await this.sendMetric("app_load_error", {
      screen_name: screenName,
      error_code: errorCode,
      error_message: errorMessage,
      error_type: options?.errorType || "unknown",
      http_status: options?.httpStatus,
      retry_count: options?.retryCount,
      stack_trace: stackTrace,
    });
  }

  // ============================================================
  // Raw Event Sending
  // ============================================================

  /**
   * Send a raw button_click event
   */
  async sendButtonClick(payload: ButtonClickPayload): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(payload.screen_name);
    await this.sendMetric("button_click", payload);
  }

  /**
   * Send a raw session_start event
   */
  async sendSessionStart(payload: SessionStartPayload): Promise<void> {
    await this.sendMetric("session_start", payload);
  }

  /**
   * Send a raw session_end event
   */
  async sendSessionEnd(payload: SessionEndPayload): Promise<void> {
    await this.sendMetric("session_end", payload);
  }

  /**
   * Send a raw app_load_success event
   */
  async sendAppLoadSuccess(payload: AppLoadSuccessPayload): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(payload.screen_name);
    await this.sendMetric("app_load_success", payload);
  }

  /**
   * Send a raw app_load_error event
   */
  async sendAppLoadError(payload: AppLoadErrorPayload): Promise<void> {
    this.eventCount++;
    this.updateScreenHistory(payload.screen_name);
    await this.sendMetric("app_load_error", payload);
  }

  // ============================================================
  // Internal Methods
  // ============================================================

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private updateScreenHistory(screenName: string): void {
    if (this.screenHistory[this.screenHistory.length - 1] !== screenName) {
      this.screenHistory.push(screenName);
    }
  }

  private async sendMetric(eventType: FrontendEventType, payload: unknown): Promise<void> {
    if (this.config.disabled) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.frontendMetricsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anon-project-id": this.config.projectId,
        },
        body: JSON.stringify({
          event_type: eventType,
          metric_value: JSON.stringify(payload),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(
          `[MimosFrontendAnalytics] Failed to send metric: ${response.status} ${errorBody}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[MimosFrontendAnalytics] Request timed out");
      } else {
        console.error("[MimosFrontendAnalytics] Failed to send metric:", error);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
