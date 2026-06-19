use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

// ─── Config struct ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct AppConfig {
    /// Avatar character: "einstein" | "tesla" | "mendeleev" | "musk"
    pub avatar: String,
    /// Chat panel position relative to the avatar: "left" | "right" | "bottom"
    pub panel_position: String,
    /// Active AI provider id, e.g. "anthropic" | "openai" | "gemini"
    #[serde(default = "default_active_ai_provider")]
    pub active_ai_provider: String,
    /// API keys by provider id. Values are stored locally in config.toml.
    #[serde(default = "default_api_keys")]
    pub api_keys: HashMap<String, String>,
    /// Legacy Anthropic API key kept for old config.toml compatibility.
    pub api_key: String,
    /// Whether Buddy is visible on the desktop.
    pub pet_enabled: bool,
    /// Whether to capture and analyse the desktop automatically
    pub monitor_desktop: bool,
    /// Whether to capture and analyse browser windows automatically
    pub monitor_browser: bool,
    /// Whether to proactively offer suggestions
    pub auto_suggest: bool,
    /// When true, screenshots are never persisted or sent
    pub private_mode: bool,
    /// Whether text-to-speech is enabled for avatar responses
    pub voice_enabled: bool,
    /// How often (in seconds) to take an automatic screenshot
    pub capture_interval_secs: u64,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            avatar: "einstein".into(),
            panel_position: "right".into(),
            active_ai_provider: "gemini".into(),
            api_keys: default_api_keys(),
            api_key: String::new(),
            pet_enabled: true,
            monitor_desktop: true,
            monitor_browser: true,
            auto_suggest: true,
            private_mode: false,
            voice_enabled: false,
            capture_interval_secs: 30,
        }
    }
}

impl AppConfig {
    // ── File path ─────────────────────────────────────────────────────────────

    fn config_path() -> Result<PathBuf> {
        let base = dirs::config_dir()
            .ok_or_else(|| anyhow!("Could not determine platform config directory"))?;
        Ok(base.join("buddy-avatar").join("config.toml"))
    }

    // ── Load ──────────────────────────────────────────────────────────────────

    /// Loads the config from disk.
    /// If the file does not exist yet the default config is returned and
    /// immediately saved so subsequent calls find a valid file.
    pub fn load() -> Result<Self> {
        let path = Self::config_path()?;

        if !path.exists() {
            let mut default = Self::default();
            #[cfg(debug_assertions)]
            default.import_codex_debate_keys();
            default.save()?;
            return Ok(default);
        }

        let content = std::fs::read_to_string(&path)
            .map_err(|e| anyhow!("Failed to read config file at {:?}: {}", path, e))?;

        let mut config: Self = toml::from_str(&content)
            .map_err(|e| anyhow!("Failed to parse config file: {}", e))?;
        #[cfg(debug_assertions)]
        config.import_codex_debate_keys();
        config.normalize_api_keys();

        Ok(config)
    }

    // ── Save ──────────────────────────────────────────────────────────────────

    /// Serialises the config and writes it to disk, creating any missing
    /// parent directories in the process.
    pub fn save(&self) -> Result<()> {
        let path = Self::config_path()?;

        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| anyhow!("Failed to create config directory: {}", e))?;
        }

        let mut normalized = self.clone();
        normalized.normalize_api_keys();
        let content = toml::to_string_pretty(&normalized)
            .map_err(|e| anyhow!("Failed to serialise config: {}", e))?;

        std::fs::write(&path, content)
            .map_err(|e| anyhow!("Failed to write config file at {:?}: {}", path, e))?;

        Ok(())
    }

    pub(crate) fn normalize_api_keys(&mut self) {
        let defaults = default_api_keys();
        for (provider, value) in defaults {
            self.api_keys.entry(provider).or_insert(value);
        }
        if !self.api_key.is_empty() && self.api_keys.get("anthropic").map_or(true, String::is_empty) {
            self.api_keys
                .insert("anthropic".into(), self.api_key.clone());
        }
        if let Some(anthropic) = self.api_keys.get("anthropic") {
            self.api_key = anthropic.clone();
        }
        if !is_known_ai_provider(&self.active_ai_provider) {
            self.active_ai_provider = "gemini".into();
        }
    }

    #[cfg(debug_assertions)]
    fn import_codex_debate_keys(&mut self) {
        if std::env::var("BUDDY_IMPORT_DEV_KEYS").ok().as_deref() != Some("1") {
            return;
        }

        let path = std::env::var("BUDDY_DEV_ENV_FILE")
            .map(PathBuf::from)
            .or_else(|_| {
                std::env::var("HOME")
                    .map(|home| PathBuf::from(home).join(".codex/mcp/claude-review.env"))
            });

        let Ok(path) = path else {
            return;
        };

        let Ok(content) = std::fs::read_to_string(path) else {
            return;
        };

        for line in content.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }
            let Some((key, value)) = line.split_once('=') else {
                continue;
            };
            let value = value.trim().trim_matches('"').trim_matches('\'');
            if value.is_empty() {
                continue;
            }
            let provider = match key.trim() {
                "ANTHROPIC_API_KEY" => "anthropic",
                "GEMINI_API_KEY" | "GEMINI_FILES_API_KEY" => "gemini",
                "DEEPSEEK_API_KEY" => "deepseek",
                _ => continue,
            };
            let entry = self.api_keys.entry(provider.to_string()).or_default();
            if entry.trim().is_empty() {
                *entry = value.to_string();
            }
        }
    }
}

fn default_active_ai_provider() -> String {
    "gemini".into()
}

fn is_known_ai_provider(provider: &str) -> bool {
    default_api_keys().contains_key(provider)
}

fn default_api_keys() -> HashMap<String, String> {
    [
        "anthropic",
        "openai",
        "gemini",
        "xai",
        "deepseek",
        "groq",
        "mistral",
        "openrouter",
        "perplexity",
        "together",
    ]
    .into_iter()
    .map(|provider| (provider.to_string(), String::new()))
    .collect()
}
