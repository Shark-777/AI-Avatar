use anyhow::{anyhow, Result};
use base64::{engine::general_purpose, Engine as _};
use tokio::process::Command;
use uuid::Uuid;

/// Takes a screenshot of the primary display and returns it as a base64-encoded PNG string.
///
/// On macOS, this uses the `screencapture` CLI tool (ships with the OS).
/// On other platforms this returns an error; extend with platform-specific
/// implementations (e.g. `xcap` or `x11grab`) as needed.
pub async fn take_screenshot() -> Result<String> {
    #[cfg(target_os = "macos")]
    {
        let tmp_path = format!("/tmp/buddy_capture_{}.png", Uuid::new_v4());

        // -x  silence (no shutter sound)
        // -t  file type
        let status = Command::new("screencapture")
            .args(["-x", "-t", "png", tmp_path.as_str()])
            .status()
            .await
            .map_err(|e| anyhow!("Failed to launch screencapture: {}", e))?;

        if !status.success() {
            return Err(anyhow!(
                "screencapture exited with status: {}",
                status.code().unwrap_or(-1)
            ));
        }

        let bytes = std::fs::read(&tmp_path)
            .map_err(|e| anyhow!("Failed to read screenshot file: {}", e))?;

        // Clean up immediately so we don't leave stale files on disk.
        let _ = std::fs::remove_file(&tmp_path);

        Ok(general_purpose::STANDARD.encode(&bytes))
    }

    #[cfg(not(target_os = "macos"))]
    {
        Err(anyhow!("Screen capture is only supported on macOS"))
    }
}
