use anyhow::{anyhow, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

// ─── Response types ───────────────────────────────────────────────────────────

/// Describes an overlay annotation that should be drawn on screen.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Annotation {
    /// Shape variant: "none" | "circle" | "arrow" | "rectangle"
    #[serde(rename = "type")]
    pub annotation_type: String,
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
    pub label: String,
}

impl Default for Annotation {
    fn default() -> Self {
        Self {
            annotation_type: "none".into(),
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            label: String::new(),
        }
    }
}

/// Describes an optional UI-automation action for the avatar to perform.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ActionSuggestion {
    /// Peekaboo tool identifier, e.g. "" | "peekaboo.click" | "peekaboo.type" | "peekaboo.set-value"
    pub tool: String,
    /// Human-readable description of the UI element to target
    pub target: String,
}

impl Default for ActionSuggestion {
    fn default() -> Self {
        Self {
            tool: String::new(),
            target: String::new(),
        }
    }
}

/// The full, structured response returned by `analyze_with_claude`.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClaudeResponse {
    /// Short summary of what is currently on screen
    pub context: String,
    /// Whether an error, warning, or problem was detected
    pub error_detected: bool,
    /// Actionable recommendation for the user
    pub recommendation: String,
    /// Overlay annotation to draw (annotation_type "none" → draw nothing)
    pub annotation: Annotation,
    /// Optional UI-automation action
    pub action_suggestion: ActionSuggestion,
    /// Avatar emotion/state: "idle" | "thinking" | "speaking" | "alert" | "peek"
    pub avatar_state: String,
    /// Model's confidence in its analysis, 0.0–1.0
    pub confidence: f32,
}

impl Default for ClaudeResponse {
    fn default() -> Self {
        Self {
            context: String::new(),
            error_detected: false,
            recommendation: String::new(),
            annotation: Annotation::default(),
            action_suggestion: ActionSuggestion::default(),
            avatar_state: "idle".into(),
            confidence: 0.0,
        }
    }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT: &str = r#"You are Buddy, an AI desktop companion avatar. Analyse the screenshot provided by the user and return ONLY a valid JSON object — no markdown fences, no explanation, just raw JSON.

The JSON must match this exact schema:
{
  "context": "<string: one-sentence summary of what is visible on screen>",
  "error_detected": <boolean>,
  "recommendation": "<string: concrete, actionable suggestion — empty string if nothing to add>",
  "annotation": {
    "type": "<'none' | 'circle' | 'arrow' | 'rectangle'>",
    "x": <integer: left edge in screen pixels>,
    "y": <integer: top edge in screen pixels>,
    "w": <integer: width in pixels>,
    "h": <integer: height in pixels>,
    "label": "<string: short label for the annotation>"
  },
  "action_suggestion": {
    "tool": "<'' | 'peekaboo.click' | 'peekaboo.type' | 'peekaboo.set-value'>",
    "target": "<string: description of UI element to target>"
  },
  "avatar_state": "<'idle' | 'thinking' | 'speaking' | 'alert' | 'peek'>",
  "confidence": <float 0.0–1.0>
}

Rules:
- annotation.type MUST be "none" when there is nothing specific to highlight.
- avatar_state MUST be "alert" when error_detected is true.
- avatar_state MUST be "speaking" when recommendation is non-empty and error_detected is false.
- avatar_state SHOULD be "thinking" when the analysis is complex but no clear recommendation exists yet.
- avatar_state is "idle" when the screen looks normal and no action is needed.
- action_suggestion.tool MUST be "" when no automation action is appropriate.
- confidence reflects how certain you are about your analysis (0.0 = very uncertain, 1.0 = very certain).
- Do NOT wrap the JSON in markdown code fences.
- Do NOT add any text before or after the JSON object.
"#;

// ─── API call ─────────────────────────────────────────────────────────────────

/// Sends a screenshot (as a base64-encoded PNG) together with an optional
/// user message to the Claude vision API and returns a structured response.
pub async fn analyze_with_claude(
    image_base64: &str,
    api_key: &str,
    user_message: Option<&str>,
) -> Result<ClaudeResponse> {
    let client = Client::new();

    // Build the content array: always include the image, optionally add text.
    let mut content: Vec<Value> = vec![json!({
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": "image/png",
            "data": image_base64
        }
    })];

    let text = user_message.unwrap_or("Please analyse this screenshot and provide your assessment.");
    content.push(json!({
        "type": "text",
        "text": text
    }));

    let body = json!({
        "model": "claude-opus-4-8",
        "max_tokens": 1024,
        "system": SYSTEM_PROMPT,
        "messages": [
            {
                "role": "user",
                "content": content
            }
        ]
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| anyhow!("Network error calling Claude API: {}", e))?;

    let status = response.status();
    let response_text = response
        .text()
        .await
        .map_err(|e| anyhow!("Failed to read Claude API response body: {}", e))?;

    if !status.is_success() {
        return Err(anyhow!(
            "Claude API returned HTTP {}: {}",
            status,
            response_text
        ));
    }

    // Parse the outer API envelope.
    let envelope: Value = serde_json::from_str(&response_text)
        .map_err(|e| anyhow!("Failed to parse Claude API envelope: {} — body: {}", e, response_text))?;

    // Extract the text content from the first content block.
    let text_content = envelope
        .get("content")
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.first())
        .and_then(|block| block.get("text"))
        .and_then(|t| t.as_str())
        .ok_or_else(|| anyhow!("Unexpected Claude API response shape: {}", response_text))?;

    // Strip accidental markdown fences if Claude included them despite instructions.
    let cleaned = strip_markdown_fences(text_content);

    // Parse into our structured response type.
    let claude_response: ClaudeResponse = serde_json::from_str(cleaned)
        .map_err(|e| anyhow!("Failed to parse Claude JSON response: {} — text: {}", e, cleaned))?;

    Ok(claude_response)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Removes optional ```json … ``` fences that the model might add.
fn strip_markdown_fences(s: &str) -> &str {
    let s = s.trim();
    // Remove opening fence (```json or ```)
    let s = if s.starts_with("```json") {
        &s[7..]
    } else if s.starts_with("```") {
        &s[3..]
    } else {
        s
    };
    // Remove closing fence
    let s = s.trim_end_matches("```").trim();
    s
}
