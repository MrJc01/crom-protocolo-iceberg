// Iceberg Desktop Library
// Provides Tauri commands for system information

use serde::{Deserialize, Serialize};
use sysinfo::System;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemMetrics {
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_available: u64,
    pub cpu_count: usize,
    pub cpu_usage: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    pub mode: String,
    pub version: String,
    pub platform: String,
}

/// Get real system metrics from the OS
#[tauri::command]
fn get_system_metrics() -> SystemMetrics {
    let mut sys = System::new_all();
    sys.refresh_all();

    SystemMetrics {
        memory_total: sys.total_memory(),
        memory_used: sys.used_memory(),
        memory_available: sys.available_memory(),
        cpu_count: sys.cpus().len(),
        cpu_usage: sys.global_cpu_usage(),
    }
}

/// Get app information
#[tauri::command]
fn get_app_info() -> AppInfo {
    AppInfo {
        mode: "local".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        platform: std::env::consts::OS.to_string(),
    }
}

/// Check if running in local mode (always true for desktop)
#[tauri::command]
fn is_local_mode() -> bool {
    true
}

/// Open external URL in default browser
#[tauri::command]
fn open_external(url: String) -> Result<(), String> {
    open::that(&url).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_system_metrics,
            get_app_info,
            is_local_mode,
            open_external
        ])
        .setup(|app| {
            // Log startup
            println!("🧊 Iceberg Desktop started in LOCAL mode");
            println!("📍 Version: {}", env!("CARGO_PKG_VERSION"));
            
            // Get main window and set title with mode
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_title("Iceberg (Modo Local)");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
