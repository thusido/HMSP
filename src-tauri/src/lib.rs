#[cfg(debug_assertions)]
use tauri::Manager;
use tauri_plugin_fs::FsExt;

/// Grants recursive fs access to a user-picked directory (dialog paths work,
/// but joined sub-paths hit `forbidden` without an explicit scope).
#[tauri::command]
fn allow_dir_recursive(app: tauri::AppHandle, path: String) -> Result<(), String> {
  app.fs_scope()
    .allow_directory(path, true)
    .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_android_fs::init())
    .invoke_handler(tauri::generate_handler![allow_dir_recursive])
    .setup(|_app| {
      #[cfg(debug_assertions)]
      {
        if let Some(window) = _app.get_webview_window("main") {
          window.open_devtools();
        }
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
