use std::sync::Mutex;

use tauri::{AppHandle, Manager, State};

mod capture;
mod claude;
mod config;
mod database;
mod overlay;

pub use claude::{Annotation, ClaudeResponse};
pub use config::AppConfig;
pub use database::Message;

// ─── Application state ────────────────────────────────────────────────────────

/// Global state available to every Tauri command.
pub struct AppState {
    pub db: Mutex<database::Database>,
    pub config: Mutex<AppConfig>,
}

// ─── Commands: screen capture ─────────────────────────────────────────────────

/// Captures the primary display and returns a base64-encoded PNG string.
#[tauri::command]
async fn capture_screen() -> Result<String, String> {
    capture::take_screenshot()
        .await
        .map_err(|e| e.to_string())
}

// ─── Commands: Claude analysis ────────────────────────────────────────────────

/// Sends a screenshot to the Claude vision API and returns a structured response.
#[tauri::command]
async fn analyze_screen(
    image_base64: String,
    api_key: String,
    user_message: Option<String>,
) -> Result<ClaudeResponse, String> {
    claude::analyze_with_claude(&image_base64, &api_key, user_message.as_deref())
        .await
        .map_err(|e| e.to_string())
}

// ─── Commands: message history ────────────────────────────────────────────────

/// Persists a chat message to the database and returns its row id.
#[tauri::command]
fn save_message(
    role: String,
    content: String,
    avatar_state: String,
    state: State<AppState>,
) -> Result<i64, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_message(&role, &content, &avatar_state)
        .map_err(|e| e.to_string())
}

/// Returns up to `limit` messages ordered newest-first.
#[tauri::command]
fn get_messages(limit: i32, state: State<AppState>) -> Result<Vec<Message>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_messages(limit).map_err(|e| e.to_string())
}

// ─── Commands: configuration ──────────────────────────────────────────────────

/// Loads the application configuration from disk and returns it.
#[tauri::command]
fn load_config(state: State<AppState>) -> Result<AppConfig, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

/// Persists a new configuration to disk and updates the in-memory state.
#[tauri::command]
fn save_config(new_config: AppConfig, state: State<AppState>) -> Result<(), String> {
    new_config.save().map_err(|e| e.to_string())?;
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    *config = new_config;
    Ok(())
}

// ─── Commands: overlay window ─────────────────────────────────────────────────

/// Creates or shows the full-screen transparent annotation overlay.
#[tauri::command]
fn show_overlay(app: AppHandle) -> Result<(), String> {
    overlay::show_overlay(&app).map_err(|e| e.to_string())
}

/// Hides the overlay window.
#[tauri::command]
fn hide_overlay(app: AppHandle) -> Result<(), String> {
    overlay::hide_overlay(&app).map_err(|e| e.to_string())
}

/// Sends an annotation payload to the overlay window for rendering.
#[tauri::command]
fn update_annotation(app: AppHandle, annotation: Annotation) -> Result<(), String> {
    overlay::update_annotation(&app, annotation).map_err(|e| e.to_string())
}

/// Instructs the overlay to clear all drawn annotations.
#[tauri::command]
fn clear_annotation(app: AppHandle) -> Result<(), String> {
    overlay::clear_annotation(&app).map_err(|e| e.to_string())
}

// ─── Commands: facts ──────────────────────────────────────────────────────────

/// Upserts a key-value fact in the database.
#[tauri::command]
fn save_fact(key: String, value: String, state: State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.save_fact(&key, &value).map_err(|e| e.to_string())
}

/// Retrieves a fact by key, returning `None` if it does not exist.
#[tauri::command]
fn get_fact(key: String, state: State<AppState>) -> Result<Option<String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_fact(&key).map_err(|e| e.to_string())
}

// ─── Commands: screen info ────────────────────────────────────────────────────

/// Returns the pixel dimensions (width, height) of the primary monitor.
#[tauri::command]
fn get_screen_size(app: AppHandle) -> Result<(u32, u32), String> {
    overlay::primary_monitor_size(&app).map_err(|e| e.to_string())
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/// Called from `main.rs`. Initialises all subsystems and starts the Tauri
/// event loop.
pub fn run() {
    // Initialise the logger so `log::info!` / `log::error!` etc. work.
    env_logger::init();

    // Eagerly open the database and load config before the app window appears
    // so that the first render has everything it needs.
    let db = database::Database::new().expect("Failed to open database");
    let config = AppConfig::load().expect("Failed to load config");

    tauri::Builder::default()
        // ── Plugins ──────────────────────────────────────────────────────────
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        // ── State ─────────────────────────────────────────────────────────────
        .manage(AppState {
            db: Mutex::new(db),
            config: Mutex::new(config),
        })
        // ── Setup hook ────────────────────────────────────────────────────────
        .setup(|app| {
            // Position the main window in the bottom-right corner of the
            // primary monitor, leaving a small margin.
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let screen_size = monitor.size();
                    let scale = monitor.scale_factor();

                    // Physical → logical pixels
                    let screen_w = (screen_size.width as f64 / scale) as i32;
                    let screen_h = (screen_size.height as f64 / scale) as i32;

                    let win_w = 200_i32;
                    let win_h = 220_i32;
                    let margin = 20_i32;

                    let x = screen_w - win_w - margin;
                    let y = screen_h - win_h - margin;

                    // Only reposition if we got sensible values.
                    if x > 0 && y > 0 {
                        let _ = window.set_position(tauri::PhysicalPosition::new(
                            (x as f64 * scale) as i32,
                            (y as f64 * scale) as i32,
                        ));
                    }
                }
            }
            Ok(())
        })
        // ── Commands ──────────────────────────────────────────────────────────
        .invoke_handler(tauri::generate_handler![
            capture_screen,
            analyze_screen,
            save_message,
            get_messages,
            load_config,
            save_config,
            show_overlay,
            hide_overlay,
            update_annotation,
            clear_annotation,
            save_fact,
            get_fact,
            get_screen_size,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Buddy application");
}
