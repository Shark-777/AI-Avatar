use std::{sync::Mutex, time::Duration};

use tauri::{AppHandle, Manager, State, WebviewWindow};

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

struct CaptureWindowRestore {
    main_window: Option<WebviewWindow>,
    overlay_window: Option<WebviewWindow>,
    main_was_visible: bool,
    overlay_was_visible: bool,
}

impl Drop for CaptureWindowRestore {
    fn drop(&mut self) {
        if self.main_was_visible {
            if let Some(window) = &self.main_window {
                let _ = window.show();
            }
        }
        if self.overlay_was_visible {
            if let Some(window) = &self.overlay_window {
                let _ = window.show();
            }
        }
    }
}

// ─── Commands: screen capture ─────────────────────────────────────────────────

/// Captures the primary display and returns a base64-encoded PNG string.
#[tauri::command]
async fn capture_screen(app: AppHandle) -> Result<String, String> {
    let main_window = app.get_webview_window("main");
    let overlay_window = app.get_webview_window("overlay");
    let main_was_visible = main_window
        .as_ref()
        .and_then(|window| window.is_visible().ok())
        .unwrap_or(true);
    let overlay_was_visible = overlay_window
        .as_ref()
        .and_then(|window| window.is_visible().ok())
        .unwrap_or(false);
    let _restore = CaptureWindowRestore {
        main_window: main_window.clone(),
        overlay_window: overlay_window.clone(),
        main_was_visible,
        overlay_was_visible,
    };

    if let Some(window) = &overlay_window {
        let _ = window.hide();
    }
    if let Some(window) = &main_window {
        let _ = window.hide();
    }

    // Give macOS a moment to repaint the desktop without Buddy before `screencapture`.
    tokio::time::sleep(Duration::from_millis(180)).await;

    let result = capture::take_screenshot().await.map_err(|e| e.to_string());

    result
}

// ─── Commands: Claude analysis ────────────────────────────────────────────────

/// Sends a screenshot to the Claude vision API and returns a structured response.
#[tauri::command]
async fn analyze_screen(
    image_base64: String,
    api_key: String,
    provider: Option<String>,
    user_message: Option<String>,
) -> Result<ClaudeResponse, String> {
    claude::analyze_with_provider(
        provider.as_deref().unwrap_or("anthropic"),
        &image_base64,
        &api_key,
        user_message.as_deref(),
    )
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
    let mut new_config = new_config;
    new_config.normalize_api_keys();
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

#[tauri::command]
fn set_main_window_mode(
    app: AppHandle,
    mode: String,
    saved_x: Option<f64>,
    saved_y: Option<f64>,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    let monitor = window
        .primary_monitor()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Primary monitor not found".to_string())?;

    let scale = monitor.scale_factor();
    let size = monitor.size();
    let screen_w_physical = size.width as f64;
    let screen_h_physical = size.height as f64;
    let screen_w = screen_w_physical / scale;
    let screen_h = screen_h_physical / scale;
    let margin = 20.0_f64;

    let (win_w, win_h, resizable, x, y) = match mode.as_str() {
        "hidden" => {
            let w = 326.0_f64;
            let h = 88.0_f64;
            (w, h, false, screen_w - w - margin, screen_h - h - margin)
        }
        "settings" => {
            let w = 760.0_f64.min(screen_w - margin * 2.0);
            let h = 680.0_f64.min(screen_h - margin * 2.0);
            (w, h, true, (screen_w - w) / 2.0, (screen_h - h) / 2.0)
        }
        "chat" => {
            let w = 840.0_f64.min(screen_w - margin * 2.0);
            let h = 560.0_f64.min(screen_h - margin * 2.0);
            (w, h, false, screen_w - w - margin, screen_h - h - margin)
        }
        _ => {
            let w = 480.0_f64;
            let h = 392.0_f64;
            (w, h, false, screen_w - w - margin, screen_h - h - 76.0)
        }
    };

    window.set_resizable(resizable).map_err(|e| e.to_string())?;
    window
        .set_size(tauri::LogicalSize::new(win_w, win_h))
        .map_err(|e| e.to_string())?;
    if mode != "settings" {
        if let (Some(saved_x), Some(saved_y)) = (saved_x, saved_y) {
            let clamped_x = saved_x.clamp(0.0, screen_w - win_w);
            let clamped_y = saved_y.clamp(0.0, screen_h - win_h);
            window
                .set_position(tauri::LogicalPosition::new(clamped_x, clamped_y))
                .map_err(|e| e.to_string())?;
        } else {
            window
                .set_position(tauri::LogicalPosition::new(x, y))
                .map_err(|e| e.to_string())?;
        }
    } else {
        window
            .set_position(tauri::LogicalPosition::new(x, y))
            .map_err(|e| e.to_string())?;
    }
    window.show().map_err(|e| e.to_string())?;
    if mode == "settings" {
        let _ = window.set_focus();
    }

    Ok(())
}

#[tauri::command]
fn start_main_window_drag(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main window not found".to_string())?;
    window.start_dragging().map_err(|e| e.to_string())
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
    let starts_hidden = !config.pet_enabled;

    tauri::Builder::default()
        // ── State ─────────────────────────────────────────────────────────────
        .manage(AppState {
            db: Mutex::new(db),
            config: Mutex::new(config),
        })
        // ── Setup hook ────────────────────────────────────────────────────────
        .setup(move |app| {
            // Position the main window in the bottom-right corner of the
            // primary monitor, leaving a small margin.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_ignore_cursor_events(false);
                let _ = window.set_focusable(true);
                let _ = window.set_shadow(false);
                if let Ok(Some(monitor)) = window.primary_monitor() {
                    let screen_size = monitor.size();
                    let scale = monitor.scale_factor();

                    // Physical → logical pixels
                    let screen_w = (screen_size.width as f64 / scale) as i32;
                    let screen_h = (screen_size.height as f64 / scale) as i32;

                    let (win_w, win_h, margin_y) = if starts_hidden {
                        (326_i32, 88_i32, 20_i32)
                    } else {
                        (480_i32, 392_i32, 76_i32)
                    };
                    let margin_x = 20_i32;

                    let x = screen_w - win_w - margin_x;
                    let y = screen_h - win_h - margin_y;

                    // Only reposition if we got sensible values.
                    if x > 0 && y > 0 {
                        let _ = window.set_size(tauri::LogicalSize::new(win_w, win_h));
                        let _ = window.set_position(tauri::LogicalPosition::new(x, y));
                    }
                }
                let _ = window.show();
                let _ = window.set_focus();
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
            set_main_window_mode,
            start_main_window_drag,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running Buddy application");
}
