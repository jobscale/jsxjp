use tauri::Manager;
use tauri::image::Image;

#[tauri::command]
fn change_app_icon(app: tauri::AppHandle, status: String) {
    println!("change_app_icon: {}", status);

    let icon_path = match status.as_str() {
        "notification" => "assets/icon-notification.png",
        _              => "assets/icon-normal.png",
    };

    if let Ok(resource_path) = app.path().resolve(icon_path, tauri::path::BaseDirectory::Resource) {
        if let Ok(image) = Image::from_path(&resource_path) {
            if let Some(window) = app.get_webview_window("main") {
                println!("Setting icon for window 'main': {}", status);
                let _ = window.set_icon(image);
            } else {
                println!("Failed to get window 'main' to set icon.");
            }
        } else {
            println!("Failed to load image from path: {}", resource_path.display());
        }
    } else {
        println!("Failed to resolve resource path for icon: {}", icon_path);
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
        .setup(|_app| {
            // setup 内での個別の window.on_navigation 登録は不要になったため削除
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
