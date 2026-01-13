"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimosFrontendAnalytics = void 0;
/**
 * Client for sending frontend metrics to the Mimos App Analytics Service.
 * Use this in browser/React Native/mobile apps.
 */
class MimosFrontendAnalytics {
    constructor(config) {
        this.sessionId = null;
        this.sessionStartTime = null;
        this.screenHistory = [];
        this.eventCount = 0;
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
    isDisabled() {
        return this.config.disabled;
    }
    // ============================================================
    // Session Management
    // ============================================================
    /**
     * Start a new session. Call this when the app launches or user logs in.
     */
    async startSession(payload) {
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
    async endSession(exitReason) {
        if (!this.sessionId || !this.sessionStartTime) {
            console.warn("[MimosFrontendAnalytics] No active session to end");
            return;
        }
        const payload = {
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
    getSessionId() {
        return this.sessionId;
    }
    // ============================================================
    // User Interaction Events
    // ============================================================
    /**
     * Track a button click
     */
    async trackButtonClick(buttonId, screenName, options) {
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
    async trackSwipe(payload) {
        this.eventCount++;
        this.updateScreenHistory(payload.screen_name);
        await this.sendMetric("motion_swipe", payload);
    }
    /**
     * Track a scroll event
     */
    async trackScroll(payload) {
        this.eventCount++;
        this.updateScreenHistory(payload.screen_name);
        await this.sendMetric("motion_scroll", payload);
    }
    /**
     * Track element focus (form field interaction)
     */
    async trackElementFocus(payload) {
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
    async trackLoadSuccess(screenName, loadTimeMs, options) {
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
    async trackLoadError(screenName, error, options) {
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
    async sendButtonClick(payload) {
        this.eventCount++;
        this.updateScreenHistory(payload.screen_name);
        await this.sendMetric("button_click", payload);
    }
    /**
     * Send a raw session_start event
     */
    async sendSessionStart(payload) {
        await this.sendMetric("session_start", payload);
    }
    /**
     * Send a raw session_end event
     */
    async sendSessionEnd(payload) {
        await this.sendMetric("session_end", payload);
    }
    /**
     * Send a raw app_load_success event
     */
    async sendAppLoadSuccess(payload) {
        this.eventCount++;
        this.updateScreenHistory(payload.screen_name);
        await this.sendMetric("app_load_success", payload);
    }
    /**
     * Send a raw app_load_error event
     */
    async sendAppLoadError(payload) {
        this.eventCount++;
        this.updateScreenHistory(payload.screen_name);
        await this.sendMetric("app_load_error", payload);
    }
    // ============================================================
    // Internal Methods
    // ============================================================
    generateSessionId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    updateScreenHistory(screenName) {
        if (this.screenHistory[this.screenHistory.length - 1] !== screenName) {
            this.screenHistory.push(screenName);
        }
    }
    async sendMetric(eventType, payload) {
        if (this.config.disabled)
            return;
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
                console.error(`[MimosFrontendAnalytics] Failed to send metric: ${response.status} ${errorBody}`);
            }
        }
        catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                console.error("[MimosFrontendAnalytics] Request timed out");
            }
            else {
                console.error("[MimosFrontendAnalytics] Failed to send metric:", error);
            }
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
}
exports.MimosFrontendAnalytics = MimosFrontendAnalytics;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtY2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2Zyb250ZW5kLWNsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFhQTs7O0dBR0c7QUFDSCxNQUFhLHNCQUFzQjtJQVFqQyxZQUFZLE1BQTJCO1FBTC9CLGNBQVMsR0FBa0IsSUFBSSxDQUFDO1FBQ2hDLHFCQUFnQixHQUFrQixJQUFJLENBQUM7UUFDdkMsa0JBQWEsR0FBYSxFQUFFLENBQUM7UUFDN0IsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUc3QixJQUFJLENBQUMsTUFBTSxHQUFHO1lBQ1osT0FBTyxFQUFFLElBQUk7WUFDYixRQUFRLEVBQUUsS0FBSztZQUNmLEdBQUcsTUFBTTtTQUNWLENBQUM7UUFFRixNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLE9BQU8sNkJBQTZCLENBQUM7SUFDcEUsQ0FBQztJQUVEOztPQUVHO0lBQ0gsVUFBVTtRQUNSLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFDOUIsQ0FBQztJQUVELCtEQUErRDtJQUMvRCxxQkFBcUI7SUFDckIsK0RBQStEO0lBRS9EOztPQUVHO0lBQ0gsS0FBSyxDQUFDLFlBQVksQ0FBQyxPQUEwRTtRQUMzRixNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ2pFLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFF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Q2QsT0FBTyxFQUFFO29CQUNQLGNBQWMsRUFBRSxrQkFBa0I7b0JBQ2xDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUztpQkFDekM7Z0JBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7b0JBQ25CLFVBQVUsRUFBRSxTQUFTO29CQUNyQixZQUFZLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7aUJBQ3RDLENBQUM7Z0JBQ0YsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2FBQzFCLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQ2pCLE1BQU0sU0FBUyxHQUFHLE1BQU0sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN4QyxPQUFPLENBQUMsS0FBSyxDQUNYLG1EQUFtRCxRQUFRLENBQUMsTUFBTSxJQUFJLFNBQVMsRUFBRSxDQUNsRixDQUFDO1lBQ0osQ0FBQztRQUNILENBQUM7UUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1lBQ2YsSUFBSSxLQUFLLFlBQVksS0FBSyxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssWUFBWSxFQUFFLENBQUM7Z0JBQzFELE9BQU8sQ0FBQyxLQUFLLENBQUMsNENBQTRDLENBQUMsQ0FBQztZQUM5RCxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTyxDQUFDLEtBQUssQ0FBQyxpREFBaUQsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxRSxDQUFDO1FBQ0gsQ0FBQztnQkFBUyxDQUFDO1lBQ1QsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzFCLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFyU0Qsd0RBcVNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgTWltb3NGcm9udGVuZENvbmZpZyxcbiAgRnJvbnRlbmRFdmVudFR5cGUsXG4gIEJ1dHRvbkNsaWNrUGF5bG9hZCxcbiAgTW90aW9uU3dpcGVQYXlsb2FkLFxuICBNb3Rpb25TY3JvbGxQYXlsb2FkLFxuICBTZXNzaW9uU3RhcnRQYXlsb2FkLFxuICBTZXNzaW9uRW5kUGF5bG9hZCxcbiAgRWxlbWVudEZvY3VzUGF5bG9hZCxcbiAgQXBwTG9hZFN1Y2Nlc3NQYXlsb2FkLFxuICBBcHBMb2FkRXJyb3JQYXlsb2FkLFxufSBmcm9tIFwiLi9mcm9udGVuZC10eXBlc1wiO1xuXG4vKipcbiAqIENsaWVudCBmb3Igc2VuZGluZyBmcm9udGVuZCBtZXRyaWNzIHRvIHRoZSBNaW1vcyBBcHAgQW5hbHl0aWNzIFNlcnZpY2UuXG4gKiBVc2UgdGhpcyBpbiBicm93c2VyL1JlYWN0IE5hdGl2ZS9tb2JpbGUgYXBwcy5cbiAqL1xuZXhwb3J0IGNsYXNzIE1pbW9zRnJvbnRlbmRBbmFseXRpY3Mge1xuICBwcml2YXRlIGNvbmZpZzogUmVxdWlyZWQ8TWltb3NGcm9udGVuZENvbmZpZz47XG4gIHByaXZhdGUgZnJvbnRlbmRNZXRyaWNzVXJsOiBzdHJpbmc7XG4gIHByaXZhdGUgc2Vzc2lvbklkOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzZXNzaW9uU3RhcnRUaW1lOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBzY3JlZW5IaXN0b3J5OiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGV2ZW50Q291bnQ6IG51bWJlciA9IDA7XG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNaW1vc0Zyb250ZW5kQ29uZmlnKSB7XG4gICAgdGhpcy5jb25maWcgPSB7XG4gICAgICB0aW1lb3V0OiA1MDAwLFxuICAgICAgZGlzYWJsZWQ6IGZhbHNlLFxuICAgICAgLi4uY29uZmlnLFxuICAgIH07XG5cbiAgICBjb25zdCBiYXNlVXJsID0gdGhpcy5jb25maWcuYmFzZVVybC5yZXBsYWNlKC9cXC8kLywgXCJcIik7XG4gICAgdGhpcy5mcm9udGVuZE1ldHJpY3NVcmwgPSBgJHtiYXNlVXJsfS92MS9mcm9udGVuZC1tZXRyaWNzL3dyaXRlL2A7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYW5hbHl0aWNzIGlzIGRpc2FibGVkXG4gICAqL1xuICBpc0Rpc2FibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5kaXNhYmxlZDtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBTZXNzaW9uIE1hbmFnZW1lbnRcbiAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLyoqXG4gICAqIFN0YXJ0IGEgbmV3IHNlc3Npb24uIENhbGwgdGhpcyB3aGVuIHRoZSBhcHAgbGF1bmNoZXMgb3IgdXNlciBsb2dzIGluLlxuICAgKi9cbiAgYXN5bmMgc3RhcnRTZXNzaW9uKHBheWxvYWQ6IE9taXQ8U2Vzc2lvblN0YXJ0UGF5bG9hZCwgXCJzZXNzaW9uX2lkXCI+ICYgeyBzZXNzaW9uX2lkPzogc3RyaW5nIH0pOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3Npb25JZCA9IHBheWxvYWQuc2Vzc2lvbl9pZCB8fCB0aGlzLmdlbmVyYXRlU2Vzc2lvbklkKCk7XG4gICAgdGhpcy5zZXNzaW9uSWQgPSBzZXNzaW9uSWQ7XG4gICAgdGhpcy5zZXNzaW9uU3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0aGlzLnNjcmVlbkhpc3RvcnkgPSBbXTtcbiAgICB0aGlzLmV2ZW50Q291bnQgPSAwO1xuXG4gICAgYXdhaXQgdGhpcy5zZW5kTWV0cmljKFwic2Vzc2lvbl9zdGFydFwiLCB7XG4gICAgICAuLi5wYXlsb2FkLFxuICAgICAgc2Vzc2lvbl9pZDogc2Vzc2lvbklkLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNlc3Npb25JZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmQgdGhlIGN1cnJlbnQgc2Vzc2lvbi4gQ2FsbCB0aGlzIHdoZW4gdGhlIGFwcCBjbG9zZXMgb3IgdXNlciBsb2dzIG91dC5cbiAgICovXG4gIGFzeW5jIGVuZFNlc3Npb24oZXhpdFJlYXNvbjogU2Vzc2lvbkVuZFBheWxvYWRbXCJleGl0X3JlYXNvblwiXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5zZXNzaW9uSWQgfHwgIXRoaXMuc2Vzc2lvblN0YXJ0VGltZSkge1xuICAgICAgY29uc29sZS53YXJuKFwiW01pbW9zRnJvbnRlbmRBbmFseXRpY3NdIE5vIGFjdGl2ZSBzZXNzaW9uIHRvIGVuZFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXlsb2FkOiBTZXNzaW9uRW5kUGF5bG9hZCA9IHtcbiAgICAgIHNlc3Npb25faWQ6IHRoaXMuc2Vzc2lvbklkLFxuICAgICAgc2Vzc2lvbl9kdXJhdGlvbl9tczogRGF0ZS5ub3coKSAtIHRoaXMuc2Vzc2lvblN0YXJ0VGltZSxcbiAgICAgIGV4aXRfcmVhc29uOiBleGl0UmVhc29uLFxuICAgICAgc2NyZWVuc192aXNpdGVkOiB0aGlzLnNjcmVlbkhpc3RvcnkubGVuZ3RoLFxuICAgICAgdG90YWxfZXZlbnRzOiB0aGlzLmV2ZW50Q291bnQsXG4gICAgICBsYXN0X3NjcmVlbjogdGhpcy5zY3JlZW5IaXN0b3J5W3RoaXMuc2NyZWVuSGlzdG9yeS5sZW5ndGggLSAxXSxcbiAgICB9O1xuXG4gICAgYXdhaXQgdGhpcy5zZW5kTWV0cmljKFwic2Vzc2lvbl9lbmRcIiwgcGF5bG9hZCk7XG5cbiAgICB0aGlzLnNlc3Npb25JZCA9IG51bGw7XG4gICAgdGhpcy5zZXNzaW9uU3RhcnRUaW1lID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgc2Vzc2lvbiBJRFxuICAgKi9cbiAgZ2V0U2Vzc2lvbklkKCk6IHN0cmluZyB8IG51bGwge1xuICAgIHJldHVybiB0aGlzLnNlc3Npb25JZDtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBVc2VyIEludGVyYWN0aW9uIEV2ZW50c1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogVHJhY2sgYSBidXR0b24gY2xpY2tcbiAgICovXG4gIGFzeW5jIHRyYWNrQnV0dG9uQ2xpY2soXG4gICAgYnV0dG9uSWQ6IHN0cmluZyxcbiAgICBzY3JlZW5OYW1lOiBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGJ1dHRvblRleHQ/OiBzdHJpbmc7XG4gICAgICB4PzogbnVtYmVyO1xuICAgICAgeT86IG51bWJlcjtcbiAgICB9XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZXZlbnRDb3VudCsrO1xuICAgIHRoaXMudXBkYXRlU2NyZWVuSGlzdG9yeShzY3JlZW5OYW1lKTtcblxuICAgIGF3YWl0IHRoaXMuc2VuZE1ldHJpYyhcImJ1dHRvbl9jbGlja1wiLCB7XG4gICAgICBidXR0b25faWQ6IGJ1dHRvbklkLFxuICAgICAgc2NyZWVuX25hbWU6IHNjcmVlbk5hbWUsXG4gICAgICBidXR0b25fdGV4dDogb3B0aW9ucz8uYnV0dG9uVGV4dCxcbiAgICAgIHhfcG9zaXRpb246IG9wdGlvbnM/LngsXG4gICAgICB5X3Bvc2l0aW9uOiBvcHRpb25zPy55LFxuICAgICAgdGltZXN0YW1wX21zOiBEYXRlLm5vdygpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYWNrIGEgc3dpcGUgZ2VzdHVyZVxuICAgKi9cbiAgYXN5bmMgdHJhY2tTd2lwZShwYXlsb2FkOiBNb3Rpb25Td2lwZVBheWxvYWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmV2ZW50Q291bnQrKztcbiAgICB0aGlzLnVwZGF0ZVNjcmVlbkhpc3RvcnkocGF5bG9hZC5zY3JlZW5fbmFtZSk7XG4gICAgYXdhaXQgdGhpcy5zZW5kTWV0cmljKFwibW90aW9uX3N3aXBlXCIsIHBheWxvYWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYWNrIGEgc2Nyb2xsIGV2ZW50XG4gICAqL1xuICBhc3luYyB0cmFja1Njcm9sbChwYXlsb2FkOiBNb3Rpb25TY3JvbGxQYXlsb2FkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5ldmVudENvdW50Kys7XG4gICAgdGhpcy51cGRhdGVTY3JlZW5IaXN0b3J5KHBheWxvYWQuc2NyZWVuX25hbWUpO1xuICAgIGF3YWl0IHRoaXMuc2VuZE1ldHJpYyhcIm1vdGlvbl9zY3JvbGxcIiwgcGF5bG9hZCk7XG4gIH1cblxuICAvKipcbiAgICogVHJhY2sgZWxlbWVudCBmb2N1cyAoZm9ybSBmaWVsZCBpbnRlcmFjdGlvbilcbiAgICovXG4gIGFzeW5jIHRyYWNrRWxlbWVudEZvY3VzKHBheWxvYWQ6IEVsZW1lbnRGb2N1c1BheWxvYWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmV2ZW50Q291bnQrKztcbiAgICB0aGlzLnVwZGF0ZVNjcmVlbkhpc3RvcnkocGF5bG9hZC5zY3JlZW5fbmFtZSk7XG4gICAgYXdhaXQgdGhpcy5zZW5kTWV0cmljKFwiZWxlbWVudF9mb2N1c1wiLCBwYXlsb2FkKTtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBQYWdlL1NjcmVlbiBMb2FkIEV2ZW50c1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogVHJhY2sgc3VjY2Vzc2Z1bCBwYWdlL3NjcmVlbiBsb2FkXG4gICAqL1xuICBhc3luYyB0cmFja0xvYWRTdWNjZXNzKFxuICAgIHNjcmVlbk5hbWU6IHN0cmluZyxcbiAgICBsb2FkVGltZU1zOiBudW1iZXIsXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGlzQ29sZFN0YXJ0PzogYm9vbGVhbjtcbiAgICAgIG5ldHdvcmtUeXBlPzogQXBwTG9hZFN1Y2Nlc3NQYXlsb2FkW1wibmV0d29ya190eXBlXCJdO1xuICAgICAgdHRmYk1zPzogbnVtYmVyO1xuICAgICAgcmVzb3VyY2VDb3VudD86IG51bWJlcjtcbiAgICAgIGNhY2hlSGl0PzogYm9vbGVhbjtcbiAgICB9XG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZXZlbnRDb3VudCsrO1xuICAgIHRoaXMudXBkYXRlU2NyZWVuSGlzdG9yeShzY3JlZW5OYW1lKTtcblxuICAgIGF3YWl0IHRoaXMuc2VuZE1ldHJpYyhcImFwcF9sb2FkX3N1Y2Nlc3NcIiwge1xuICAgICAgc2NyZWVuX25hbWU6IHNjcmVlbk5hbWUsXG4gICAgICBsb2FkX3RpbWVfbXM6IGxvYWRUaW1lTXMsXG4gICAgICBpc19jb2xkX3N0YXJ0OiBvcHRpb25zPy5pc0NvbGRTdGFydCA/PyBmYWxzZSxcbiAgICAgIG5ldHdvcmtfdHlwZTogb3B0aW9ucz8ubmV0d29ya1R5cGUsXG4gICAgICB0dGZiX21zOiBvcHRpb25zPy50dGZiTXMsXG4gICAgICByZXNvdXJjZV9jb3VudDogb3B0aW9ucz8ucmVzb3VyY2VDb3VudCxcbiAgICAgIGNhY2hlX2hpdDogb3B0aW9ucz8uY2FjaGVIaXQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhY2sgZmFpbGVkIHBhZ2Uvc2NyZWVuIGxvYWRcbiAgICovXG4gIGFzeW5jIHRyYWNrTG9hZEVycm9yKFxuICAgIHNjcmVlbk5hbWU6IHN0cmluZyxcbiAgICBlcnJvcjogRXJyb3IgfCBzdHJpbmcsXG4gICAgb3B0aW9ucz86IHtcbiAgICAgIGVycm9yVHlwZT86IEFwcExvYWRFcnJvclBheWxvYWRbXCJlcnJvcl90eXBlXCJdO1xuICAgICAgZXJyb3JDb2RlPzogc3RyaW5nO1xuICAgICAgaHR0cFN0YXR1cz86IG51bWJlcjtcbiAgICAgIHJldHJ5Q291bnQ/OiBudW1iZXI7XG4gICAgfVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmV2ZW50Q291bnQrKztcbiAgICB0aGlzLnVwZGF0ZVNjcmVlbkhpc3Rvcnkoc2NyZWVuTmFtZSk7XG5cbiAgICBjb25zdCBlcnJvck1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IGVycm9yO1xuICAgIGNvbnN0IGVycm9yQ29kZSA9IG9wdGlvbnM/LmVycm9yQ29kZSB8fCAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm5hbWUgOiBcIkVycm9yXCIpO1xuICAgIGNvbnN0IHN0YWNrVHJhY2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQ7XG5cbiAgICBhd2FpdCB0aGlzLnNlbmRNZXRyaWMoXCJhcHBfbG9hZF9lcnJvclwiLCB7XG4gICAgICBzY3JlZW5fbmFtZTogc2NyZWVuTmFtZSxcbiAgICAgIGVycm9yX2NvZGU6IGVycm9yQ29kZSxcbiAgICAgIGVycm9yX21lc3NhZ2U6IGVycm9yTWVzc2FnZSxcbiAgICAgIGVycm9yX3R5cGU6IG9wdGlvbnM/LmVycm9yVHlwZSB8fCBcInVua25vd25cIixcbiAgICAgIGh0dHBfc3RhdHVzOiBvcHRpb25zPy5odHRwU3RhdHVzLFxuICAgICAgcmV0cnlfY291bnQ6IG9wdGlvbnM/LnJldHJ5Q291bnQsXG4gICAgICBzdGFja190cmFjZTogc3RhY2tUcmFjZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBSYXcgRXZlbnQgU2VuZGluZ1xuICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAvKipcbiAgICogU2VuZCBhIHJhdyBidXR0b25fY2xpY2sgZXZlbnRcbiAgICovXG4gIGFzeW5jIHNlbmRCdXR0b25DbGljayhwYXlsb2FkOiBCdXR0b25DbGlja1BheWxvYWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLmV2ZW50Q291bnQrKztcbiAgICB0aGlzLnVwZGF0ZVNjcmVlbkhpc3RvcnkocGF5bG9hZC5zY3JlZW5fbmFtZSk7XG4gICAgYXdhaXQgdGhpcy5zZW5kTWV0cmljKFwiYnV0dG9uX2NsaWNrXCIsIHBheWxvYWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSByYXcgc2Vzc2lvbl9zdGFydCBldmVudFxuICAgKi9cbiAgYXN5bmMgc2VuZFNlc3Npb25TdGFydChwYXlsb2FkOiBTZXNzaW9uU3RhcnRQYXlsb2FkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zZW5kTWV0cmljKFwic2Vzc2lvbl9zdGFydFwiLCBwYXlsb2FkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmF3IHNlc3Npb25fZW5kIGV2ZW50XG4gICAqL1xuICBhc3luYyBzZW5kU2Vzc2lvbkVuZChwYXlsb2FkOiBTZXNzaW9uRW5kUGF5bG9hZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2VuZE1ldHJpYyhcInNlc3Npb25fZW5kXCIsIHBheWxvYWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSByYXcgYXBwX2xvYWRfc3VjY2VzcyBldmVudFxuICAgKi9cbiAgYXN5bmMgc2VuZEFwcExvYWRTdWNjZXNzKHBheWxvYWQ6IEFwcExvYWRTdWNjZXNzUGF5bG9hZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZXZlbnRDb3VudCsrO1xuICAgIHRoaXMudXBkYXRlU2NyZWVuSGlzdG9yeShwYXlsb2FkLnNjcmVlbl9uYW1lKTtcbiAgICBhd2FpdCB0aGlzLnNlbmRNZXRyaWMoXCJhcHBfbG9hZF9zdWNjZXNzXCIsIHBheWxvYWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSByYXcgYXBwX2xvYWRfZXJyb3IgZXZlbnRcbiAgICovXG4gIGFzeW5jIHNlbmRBcHBMb2FkRXJyb3IocGF5bG9hZDogQXBwTG9hZEVycm9yUGF5bG9hZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuZXZlbnRDb3VudCsrO1xuICAgIHRoaXMudXBkYXRlU2NyZWVuSGlzdG9yeShwYXlsb2FkLnNjcmVlbl9uYW1lKTtcbiAgICBhd2FpdCB0aGlzLnNlbmRNZXRyaWMoXCJhcHBfbG9hZF9lcnJvclwiLCBwYXlsb2FkKTtcbiAgfVxuXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBJbnRlcm5hbCBNZXRob2RzXG4gIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG4gIHByaXZhdGUgZ2VuZXJhdGVTZXNzaW9uSWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7RGF0ZS5ub3coKX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTEpfWA7XG4gIH1cblxuICBwcml2YXRlIHVwZGF0ZVNjcmVlbkhpc3Rvcnkoc2NyZWVuTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2NyZWVuSGlzdG9yeVt0aGlzLnNjcmVlbkhpc3RvcnkubGVuZ3RoIC0gMV0gIT09IHNjcmVlbk5hbWUpIHtcbiAgICAgIHRoaXMuc2NyZWVuSGlzdG9yeS5wdXNoKHNjcmVlbk5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2VuZE1ldHJpYyhldmVudFR5cGU6IEZyb250ZW5kRXZlbnRUeXBlLCBwYXlsb2FkOiB1bmtub3duKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLmRpc2FibGVkKSByZXR1cm47XG5cbiAgICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCB0aGlzLmNvbmZpZy50aW1lb3V0KTtcblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHRoaXMuZnJvbnRlbmRNZXRyaWNzVXJsLCB7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICBcImFub24tcHJvamVjdC1pZFwiOiB0aGlzLmNvbmZpZy5wcm9qZWN0SWQsXG4gICAgICAgIH0sXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBldmVudF90eXBlOiBldmVudFR5cGUsXG4gICAgICAgICAgbWV0cmljX3ZhbHVlOiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKSxcbiAgICAgICAgfSksXG4gICAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXG4gICAgICB9KTtcblxuICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICBjb25zdCBlcnJvckJvZHkgPSBhd2FpdCByZXNwb25zZS50ZXh0KCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXG4gICAgICAgICAgYFtNaW1vc0Zyb250ZW5kQW5hbHl0aWNzXSBGYWlsZWQgdG8gc2VuZCBtZXRyaWM6ICR7cmVzcG9uc2Uuc3RhdHVzfSAke2Vycm9yQm9keX1gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yICYmIGVycm9yLm5hbWUgPT09IFwiQWJvcnRFcnJvclwiKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJbTWltb3NGcm9udGVuZEFuYWx5dGljc10gUmVxdWVzdCB0aW1lZCBvdXRcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiW01pbW9zRnJvbnRlbmRBbmFseXRpY3NdIEZhaWxlZCB0byBzZW5kIG1ldHJpYzpcIiwgZXJyb3IpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==