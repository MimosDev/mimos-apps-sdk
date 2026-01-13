# Mimos Apps SDK

TypeScript SDK for integrating with the Mimos App Analytics Service. Supports both frontend (browser/mobile) and backend (MCP servers/Node.js) metrics.

## Installation

```bash
npm install mimos-apps-sdk
```

Or install from local path:

```bash
npm install /path/to/mimos-apps-sdk
```

---

## Frontend Usage (Browser / React Native / Mobile)

Use `MimosFrontendAnalytics` for tracking user interactions, page loads, and sessions.

### Quick Start

```typescript
import { MimosFrontendAnalytics } from "mimos-apps-sdk";

const analytics = new MimosFrontendAnalytics({
  baseUrl: "http://localhost:8080",
  projectId: "my-app",
});

// Start a session when app loads
await analytics.startSession({
  device_type: "mobile",
  os_name: "ios",
  os_version: "17.0",
  app_version: "1.0.0",
});

// Track button clicks
await analytics.trackButtonClick("submit-btn", "checkout-screen", {
  buttonText: "Place Order",
});

// Track page loads
await analytics.trackLoadSuccess("home-screen", 250, {
  isColdStart: true,
  networkType: "wifi",
});

// End session when app closes
await analytics.endSession("user_exit");
```

### Session Management

```typescript
// Start session (returns session ID)
const sessionId = await analytics.startSession({
  device_type: "desktop",  // "mobile" | "tablet" | "desktop"
  os_name: "web",          // "ios" | "android" | "web"
  os_version: "Chrome 120",
  app_version: "2.0.0",
  locale: "en-US",
  timezone: "America/New_York",
  screen_width: 1920,
  screen_height: 1080,
});

// Get current session ID
const currentSession = analytics.getSessionId();

// End session
await analytics.endSession("logout");  // "user_exit" | "background" | "timeout" | "crash" | "logout"
```

### User Interaction Events

```typescript
// Button click
await analytics.trackButtonClick("btn-id", "screen-name", {
  buttonText: "Click Me",
  x: 100,
  y: 200,
});

// Swipe gesture
await analytics.trackSwipe({
  direction: "left",  // "up" | "down" | "left" | "right"
  start_x: 300,
  start_y: 400,
  end_x: 50,
  end_y: 400,
  duration_ms: 200,
  screen_name: "gallery-screen",
  velocity: 1.5,
});

// Scroll event
await analytics.trackScroll({
  direction: "down",
  scroll_depth_px: 500,
  scroll_depth_percent: 50,
  start_position: 0,
  end_position: 500,
  duration_ms: 1000,
  screen_name: "feed-screen",
});

// Form field focus
await analytics.trackElementFocus({
  element_id: "email-input",
  element_type: "text_input",  // "text_input" | "dropdown" | "checkbox" | "radio" | "textarea" | "search"
  screen_name: "signup-screen",
  focus_duration_ms: 5000,
  had_interaction: true,
  field_name: "email",
});
```

### Page Load Events

```typescript
// Successful load
await analytics.trackLoadSuccess("dashboard", 450, {
  isColdStart: false,
  networkType: "cellular",  // "wifi" | "cellular" | "offline" | "unknown"
  ttfbMs: 120,
  resourceCount: 25,
  cacheHit: true,
});

// Failed load
await analytics.trackLoadError("dashboard", new Error("Network timeout"), {
  errorType: "timeout",  // "network" | "timeout" | "server" | "parse" | "unknown"
  httpStatus: 504,
  retryCount: 2,
});
```

### React Integration Example

```typescript
import { useEffect, useRef } from "react";
import { MimosFrontendAnalytics } from "mimos-apps-sdk";

// Create singleton instance
const analytics = new MimosFrontendAnalytics({
  baseUrl: process.env.REACT_APP_ANALYTICS_URL!,
  projectId: process.env.REACT_APP_PROJECT_ID!,
  disabled: process.env.NODE_ENV === "development",
});

// Hook for page tracking
function usePageTracking(screenName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    const loadTime = Date.now() - startTime.current;
    analytics.trackLoadSuccess(screenName, loadTime);
  }, [screenName]);
}

// Usage in component
function CheckoutPage() {
  usePageTracking("checkout");

  const handleSubmit = () => {
    analytics.trackButtonClick("place-order", "checkout");
    // ... submit logic
  };

  return <button onClick={handleSubmit}>Place Order</button>;
}
```

---

## Backend Usage (MCP Servers / Node.js)

Use `MimosAnalytics` and `ToolCallTracker` for tracking MCP tool calls.

### Quick Start

```typescript
import { MimosAnalytics, ToolCallTracker } from "mimos-apps-sdk";

const analytics = new MimosAnalytics({
  baseUrl: "http://localhost:8080",
  projectId: "my-mcp-server",
  apiKey: "your-api-key",
});

const tracker = new ToolCallTracker(analytics);

// Track a tool call automatically
const result = await tracker.track("search_database", async () => {
  return await database.search({ query: "test" });
}, {
  parameters: { query: "test" }
});
```

### Manual Tracking

```typescript
// Track success
await analytics.trackSuccess("search_database", 150, {
  callId: "unique-call-id",
  parameters: JSON.stringify({ query: "test" }),
  responseSizeBytes: 1024,
});

// Track error
await analytics.trackError("search_database", new Error("Connection failed"), {
  callId: "unique-call-id",
  parameters: JSON.stringify({ query: "test" }),
  errorType: "external",
});
```

### Automatic Tracking with ToolCallTracker

```typescript
const tracker = new ToolCallTracker(analytics);

// Method 1: Track a single call
const result = await tracker.track("get_user", async () => {
  return await userService.getUser(userId);
}, { parameters: { userId } });

// Method 2: Get timing metadata
const { result, durationMs, callId } = await tracker.trackWithMetadata(
  "search",
  async () => await search(query),
  { parameters: { query } }
);

// Method 3: Wrap a function
const trackedSearch = tracker.wrap("search", searchFunction);
const results = await trackedSearch({ query: "test" });
```

### MCP Server Integration

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { MimosAnalytics, ToolCallTracker } from "mimos-apps-sdk";

const analytics = new MimosAnalytics({
  baseUrl: process.env.ANALYTICS_URL!,
  projectId: process.env.PROJECT_ID!,
  apiKey: process.env.API_KEY!,
});

const tracker = new ToolCallTracker(analytics);

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  return tracker.track(name, async () => {
    switch (name) {
      case "search": return await handleSearch(args);
      default: throw new Error(`Unknown tool: ${name}`);
    }
  }, { parameters: args });
});
```

---

## Configuration

### Frontend Config

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `baseUrl` | string | Yes | - | Analytics service URL |
| `projectId` | string | Yes | - | Project identifier |
| `timeout` | number | No | 5000 | Request timeout (ms) |
| `disabled` | boolean | No | false | Disable analytics |

### Backend Config

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `baseUrl` | string | Yes | - | Analytics service URL |
| `projectId` | string | Yes | - | Project identifier |
| `apiKey` | string | Yes | - | API key for auth |
| `timeout` | number | No | 5000 | Request timeout (ms) |
| `disabled` | boolean | No | false | Disable analytics |

---

## Event Types Reference

### Frontend Events

| Event | Description |
|-------|-------------|
| `button_click` | User taps/clicks a button |
| `motion_swipe` | Swipe gesture |
| `motion_scroll` | Scroll interaction |
| `session_start` | App/session begins |
| `session_end` | App/session ends |
| `element_focus` | Form field interaction |
| `app_load_success` | Page loaded successfully |
| `app_load_error` | Page failed to load |

### Backend Events

| Event | Description |
|-------|-------------|
| `tool_call` | MCP tool invocation |
| `tool_error` | MCP tool error |

### Error Types (Backend)

| Type | Description |
|------|-------------|
| `validation` | Invalid input |
| `timeout` | Operation timed out |
| `internal` | Internal error |
| `external` | External service failure |
| `rate_limit` | Rate limited |
| `unknown` | Uncategorized |

---

## Building from Source

```bash
npm install
npm run build
```

## License

MIT
