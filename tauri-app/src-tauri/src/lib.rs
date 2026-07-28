use tauri::Manager;
use tauri::image::Image;
use tauri::tray::TrayIconBuilder;

const TRAY_ID: &str = "main";

#[tauri::command]
fn change_app_icon(app: tauri::AppHandle, status: String) {
    println!("change_app_icon: {}", status);

    let icon_path = match status.as_str() {
        "notification" => "assets/icon-notification.png",
        _              => "assets/icon-normal.png",
    };

    let resource_path = match app.path().resolve(icon_path, tauri::path::BaseDirectory::Resource) {
        Ok(p) => p,
        Err(e) => {
            println!("Failed to resolve resource path for icon '{}': {:?}", icon_path, e);
            return;
        }
    };

    let image = match Image::from_path(&resource_path) {
        Ok(img) => img,
        Err(e) => {
            println!("Failed to load image from '{}': {:?}", resource_path.display(), e);
            return;
        }
    };

    // Window icon + badge count
    if let Some(window) = app.get_webview_window("main") {
        match window.set_icon(image.clone()) {
            Ok(_) => println!("window.set_icon OK: {}", status),
            Err(e) => println!("window.set_icon FAILED: {:?}", e),
        }

        let badge = if status == "notification" { Some(1) } else { None };
        match window.set_badge_count(badge) {
            Ok(_) => println!("window.set_badge_count OK: {:?}", badge),
            Err(e) => println!("window.set_badge_count FAILED: {:?}", e),
        }
    } else {
        println!("Failed to get window 'main'.");
    }

    // Tray icon
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        match tray.set_icon(Some(image)) {
            Ok(_) => println!("tray.set_icon OK: {}", status),
            Err(e) => println!("tray.set_icon FAILED: {:?}", e),
        }
    } else {
        println!("Failed to get tray '{}'.", TRAY_ID);
    }
}

#[tauri::command]
fn greet(name: &str) -> String {
    if name.trim().is_empty() {
        return "please enter a name".to_string();
    }
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri::plugin::Builder::<tauri::Wry>::new("navigation-hook")
                .on_navigation(|webview, url| {
                    if url.as_str().contains("jsx.jp") {
                        println!("jsx.jp detected! Executing user script...");
                        let user_script = "
                            console.log('jsx.jp detected! Changing link background colors...');
                            document.querySelectorAll('a').forEach(el => {
                                el.style.backgroundColor = '#0f0';
                            });
                        ";
                        // webview インスタンスに対して直接 JavaScript を実行
                        let _ = webview.eval(user_script);
                    }
                    true // true を返して遷移を許可
                })
                .build()
        )
        .invoke_handler(tauri::generate_handler![greet, change_app_icon])
        .setup(|app| {
            // 起動時にトレイアイコンを作成しておき、後から tray_by_id(TRAY_ID) で取得して差し替える
            let default_icon = app
                .default_window_icon()
                .cloned()
                .ok_or("default window icon is not set")?;
            TrayIconBuilder::with_id(TRAY_ID)
                .icon(default_icon)
                .tooltip("tauri-app")
                .build(app)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
