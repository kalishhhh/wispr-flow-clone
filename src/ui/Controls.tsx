import { useState } from "react";
import { useRecorder } from "../audio/useRecorder";


export function Controls() {
const { start, stop } = useRecorder();
const [recording, setRecording] = useState(false);


return (
<div>
<button
onMouseDown={async () => {
setRecording(true);
await start();
}}
onMouseUp={async () => {
setRecording(false);
await stop();
}}
>
🎙 Hold to Talk
</button>
<p>Status: {recording ? "Listening…" : "Idle"}</p>
</div>
);
}