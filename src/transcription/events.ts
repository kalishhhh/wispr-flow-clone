import { listen } from "@tauri-apps/api/event";


export function listenForTranscript(cb: (text: string) => void) {
return listen<string>("transcript", (event) => {
cb(event.payload);
});
}