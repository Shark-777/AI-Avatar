use anyhow::{anyhow, Result};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::claude::Annotation;

// ─── Constants ────────────────────────────────────────────────────────────────

const OVERLAY_LABEL: &str = "overlay";
const OVERLAY_URL: &str = "index.html#/overlay";

// ─── Public API ───────────────────────────────────────────────────────────────

/// Creates (if it does not already exist) or shows the full-screen transparent
/// click-through overlay window used for drawing annotations.
pub fn show_overlay(app: &AppHandle) -> Result<()> {
    let (x, y, width, height) = primary_monitor_logical_frame(app)?;

    // If the window already exists just show it and return.
    if let Some(existing) = app.get_webview_window(OVERLAY_LABEL) {
        existing
            .set_position(tauri::LogicalPosition::new(x, y))
            .map_err(|e| anyhow!("Failed to position existing overlay window: {}", e))?;
        existing
            .set_size(tauri::LogicalSize::new(width, height))
            .map_err(|e| anyhow!("Failed to size existing overlay window: {}", e))?;
        existing
            .set_ignore_cursor_events(true)
            .map_err(|e| anyhow!("Failed to set ignore-cursor-events on existing overlay: {}", e))?;
        existing
            .show()
            .map_err(|e| anyhow!("Failed to show existing overlay window: {}", e))?;
        return Ok(());
    }

    WebviewWindowBuilder::new(app, OVERLAY_LABEL, WebviewUrl::App(OVERLAY_URL.into()))
        .title("Buddy Overlay")
        .inner_size(width, height)
        .position(x, y)
        .decorations(false)
        .transparent(true)
        .shadow(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .build()
        .map_err(|e| anyhow!("Failed to create overlay window: {}", e))?
        // Allow mouse events to pass through the window so it does not block
        // normal desktop interaction.
        .set_ignore_cursor_events(true)
        .map_err(|e| anyhow!("Failed to set ignore-cursor-events on overlay: {}", e))?;

    Ok(())
}

/// Closes the overlay window so a blank transparent annotation surface cannot
/// linger on the desktop after the annotation is cleared.
pub fn hide_overlay(app: &AppHandle) -> Result<()> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        window
            .close()
            .map_err(|e| anyhow!("Failed to close overlay window: {}", e))?;
    }
    // Silently succeed if the window does not exist yet.
    Ok(())
}

/// Emits an "annotation-update" event to the overlay window carrying the new
/// [`Annotation`] payload. The overlay's frontend listens for this event and
/// redraws accordingly.
pub fn update_annotation(app: &AppHandle, annotation: Annotation) -> Result<()> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        window
            .emit("annotation-update", &annotation)
            .map_err(|e| anyhow!("Failed to emit annotation-update event: {}", e))?;
    }
    Ok(())
}

/// Emits an "annotation-clear" event to the overlay window, instructing the
/// frontend to remove all drawn annotations.
pub fn clear_annotation(app: &AppHandle) -> Result<()> {
    if let Some(window) = app.get_webview_window(OVERLAY_LABEL) {
        window
            .emit("annotation-clear", ())
            .map_err(|e| anyhow!("Failed to emit annotation-clear event: {}", e))?;
    }
    Ok(())
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/// Returns the pixel dimensions (width, height) of the primary monitor.
pub fn primary_monitor_size(app: &AppHandle) -> Result<(u32, u32)> {
    // Use any existing window handle to query the primary monitor; fall back to
    // the main window if the overlay does not exist yet.
    let window = app
        .get_webview_window("main")
        .or_else(|| app.get_webview_window(OVERLAY_LABEL))
        .ok_or_else(|| anyhow!("No available window to query monitor info"))?;

    let monitor = window
        .primary_monitor()
        .map_err(|e| anyhow!("Failed to query primary monitor: {}", e))?
        .ok_or_else(|| anyhow!("No primary monitor found"))?;

    let size = monitor.size();
    Ok((size.width, size.height))
}

fn primary_monitor_logical_frame(app: &AppHandle) -> Result<(f64, f64, f64, f64)> {
    let window = app
        .get_webview_window("main")
        .or_else(|| app.get_webview_window(OVERLAY_LABEL))
        .ok_or_else(|| anyhow!("No available window to query monitor info"))?;

    let monitor = window
        .primary_monitor()
        .map_err(|e| anyhow!("Failed to query primary monitor: {}", e))?
        .ok_or_else(|| anyhow!("No primary monitor found"))?;

    let scale = monitor.scale_factor();
    let size = monitor.size();
    let position = monitor.position();

    Ok((
        position.x as f64 / scale,
        position.y as f64 / scale,
        size.width as f64 / scale,
        size.height as f64 / scale,
    ))
}
