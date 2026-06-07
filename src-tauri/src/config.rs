use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ─── Config struct ────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct AppConfig {
    /// Avatar character: "einstein" | "tesla" | "mendeleev" | "musk"
    pub avatar: String,
    /// Chat panel position relative to the avatar: "left" | "right" | "bottom"
    pub panel_position: String,
    /// Anthropic API key
    pub api_key: String,
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
            api_key: String::new(),
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
            let default = Self::default();
            default.save()?;
            return Ok(default);
        }

        let content = std::fs::read_to_string(&path)
            .map_err(|e| anyhow!("Failed to read config file at {:?}: {}", path, e))?;

        let config: Self = toml::from_str(&content)
            .map_err(|e| anyhow!("Failed to parse config file: {}", e))?;

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

        let content = toml::to_string_pretty(self)
            .map_err(|e| anyhow!("Failed to serialise config: {}", e))?;

        std::fs::write(&path, content)
            .map_err(|e| anyhow!("Failed to write config file at {:?}: {}", path, e))?;

        Ok(())
    }
}
