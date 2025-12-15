// Iceberg Desktop - Main Entry Point
// Sets ICEBERG_MODE=local and starts the application

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;

fn main() {
    // Always run in LOCAL mode for desktop app
    env::set_var("ICEBERG_MODE", "local");
    
    iceberg_desktop::run();
}
