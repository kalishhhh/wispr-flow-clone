#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Emitter, Window};

use futures_util::{Sink, SinkExt, StreamExt};
use serde_json::Value;
use std::{env, pin::Pin};

use once_cell::sync::OnceCell;
use tokio::sync::Mutex;

use tokio_tungstenite::{
    connect_async,
    tungstenite::{client::IntoClientRequest, Message},
};

use tauri::http::header::{AUTHORIZATION, HeaderValue};

type DeepgramSender =
    Mutex<Pin<Box<dyn Sink<Message, Error = tokio_tungstenite::tungstenite::Error> + Send>>>;

static DEEPGRAM_SENDER: OnceCell<Mutex<Option<DeepgramSender>>> = OnceCell::new();

#[tauri::command]
async fn start_transcription(window: Window) -> Result<(), String> {
    dotenvy::dotenv().ok();

    let api_key = env::var("DEEPGRAM_API_KEY")
        .map_err(|_| "Missing DEEPGRAM_API_KEY")?;

    let url = "wss://api.deepgram.com/v1/listen\
        ?encoding=linear16\
        &sample_rate=16000\
        &punctuate=true\
        &interim_results=true";

    let mut request = url
        .into_client_request()
        .map_err(|e| e.to_string())?;

    request.headers_mut().insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Token {}", api_key))
            .map_err(|e| e.to_string())?,
    );

    let (ws_stream, _) = connect_async(request)
        .await
        .map_err(|e| e.to_string())?;

    let (write, mut read) = ws_stream.split();

    let global = DEEPGRAM_SENDER.get().unwrap();
    let mut guard = global.lock().await;
    *guard = Some(Mutex::new(Box::pin(write)));

    tauri::async_runtime::spawn(async move {
        while let Some(Ok(msg)) = read.next().await {
            let Ok(text) = msg.to_text() else { continue };
            let Ok(json) = serde_json::from_str::<Value>(text) else { continue };

            let is_final = json["is_final"].as_bool().unwrap_or(false);
            let Some(transcript) =
                json["channel"]["alternatives"][0]["transcript"].as_str()
            else {
                continue;
            };

            if transcript.trim().is_empty() {
                continue;
            }

            let _ = window.emit(
                "transcript",
                serde_json::json!({
                    "text": transcript,
                    "final": is_final
                }),
            );
        }
    });

    Ok(())
}

#[tauri::command]
async fn send_audio(data: Vec<i16>) -> Result<(), String> {
    let global = DEEPGRAM_SENDER.get().ok_or("Not initialized")?;
    let guard = global.lock().await;
    let sender = guard.as_ref().ok_or("Deepgram not running")?;
    let mut sender = sender.lock().await;

    let mut bytes = Vec::with_capacity(data.len() * 2);
    for s in data {
        bytes.extend_from_slice(&s.to_le_bytes());
    }

    sender
        .send(Message::Binary(bytes))
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn stop_transcription() -> Result<(), String> {
    let global = DEEPGRAM_SENDER.get().unwrap();
    let mut guard = global.lock().await;

    if let Some(sender) = guard.take() {
        let mut sender = sender.lock().await;
        let _ = sender.send(Message::Close(None)).await;
    }

    Ok(())
}

fn main() {
    DEEPGRAM_SENDER.set(Mutex::new(None)).ok();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            start_transcription,
            send_audio,
            stop_transcription
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri app");
}
