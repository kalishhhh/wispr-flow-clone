import { invoke } from "@tauri-apps/api/core";


export function useRecorder() {
let recorder: MediaRecorder | null = null;


async function start() {
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });


recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });


recorder.ondataavailable = async (e) => {
if (e.data.size > 0) {
const buffer = await e.data.arrayBuffer();
await invoke("send_audio", { chunk: Array.from(new Uint8Array(buffer)) });
}
};


recorder.start(250); // 250ms chunks
await invoke("start_transcription");
}


async function stop() {
recorder?.stop();
await invoke("stop_transcription");
}


return { start, stop };
}