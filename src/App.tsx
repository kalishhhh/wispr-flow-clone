import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

function App() {
  /* ================= STATE ================= */

  const [liveText, setLiveText] = useState("");
  const [finalMessages, setFinalMessages] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);

  const connectingRef = useRef(false);
  const backendReady = useRef(false);
  const startedRef = useRef(false);

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms));

  const audioCtx = useRef<AudioContext | null>(null);
  const workletNode = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  /* ================= START ================= */

  const startRecording = async () => {
    if (recording || startedRef.current || connectingRef.current) {
      console.log("[Recorder] Start ignored (busy)");
      return;
    }

    console.log("[Recorder] Starting recording...");
    connectingRef.current = true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      console.log("[Recorder] Calling backend...");
      await invoke("start_transcription");

      backendReady.current = true;
      startedRef.current = true;

      console.log("[Recorder] Backend connected");

      audioCtx.current = new AudioContext({ sampleRate: 16000 });
      await audioCtx.current.resume();

      await audioCtx.current.audioWorklet.addModule(
        new URL("./audio/pcm-processor.js", import.meta.url)
      );

      const source = audioCtx.current.createMediaStreamSource(stream);

      workletNode.current = new AudioWorkletNode(
        audioCtx.current,
        "pcm-processor"
      );

      workletNode.current.port.onmessage = (event) => {
        if (!backendReady.current) return;

        const input = event.data as Float32Array;
        console.log("[Audio] chunk", input.length);

        const pcm16 = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
          pcm16[i] = Math.max(-1, Math.min(1, input[i])) * 32767;
        }

        invoke("send_audio", { data: Array.from(pcm16) }).catch(() => {});
      };

      source.connect(workletNode.current);
      workletNode.current.connect(audioCtx.current.destination);

      setRecording(true);
      console.log("[Recorder] Recording = true");
    } catch (err) {
      console.error("[Recorder] Failed to start", err);
      backendReady.current = false;
      startedRef.current = false;
      setRecording(false);
    } finally {
      connectingRef.current = false;
    }
  };

  /* ================= STOP ================= */

  const stopRecording = async () => {
    console.log("[Recorder] Stopping recording");

    backendReady.current = false;
    startedRef.current = false;
    connectingRef.current = true;

    try {
      await invoke("stop_transcription");
      console.log("[Recorder] Backend stopped");
    } catch (e) {
      console.warn("[Recorder] stop_transcription failed", e);
    }

    workletNode.current?.disconnect();
    workletNode.current = null;

    audioCtx.current?.close();
    audioCtx.current = null;

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    setRecording(false);

    // Deepgram socket cooldown (DO NOT REMOVE)
    await sleep(600);

    connectingRef.current = false;
  };

  /* ================= LISTENER ================= */

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    listen<{ text: string; final: boolean }>("transcript", (event) => {
      const payload = event.payload;
      if (!payload || typeof payload.text !== "string") return;

      console.log(
        `[Transcript] ${payload.final ? "FINAL" : "PARTIAL"}:`,
        payload.text
      );

      if (payload.final) {
        setFinalMessages((prev) => [...prev, payload.text]);
        setLiveText("");
      } else {
        setLiveText(payload.text);
      }
    }).then((fn) => {
      console.log("[Listener] Transcript listener attached");
      unlisten = fn;
    });

    return () => unlisten?.();
  }, []);

  /* ================= AUTOSCROLL ================= */

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [finalMessages, liveText]);

  /* ================= UI-ONLY: KEYBOARD SHORTCUTS ================= */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.code === "Space") {
        e.preventDefault();
        recording ? stopRecording() : startRecording();
      }

      if (e.code === "Escape") {
        e.preventDefault();
        stopRecording();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [recording]);

  /* ================= UI ================= */

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0b0b0b",
        color: "#f4f4f5",
        display: "flex",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* LEFT PANEL */}
      <div
        style={{
          width: 300,
          borderRight: "1px solid #27272a",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <h2>Voice Control</h2>

        <button
          onClick={startRecording}
          disabled={recording || connectingRef.current}
          style={{
            padding: 14,
            borderRadius: 12,
            background: recording ? "#14532d" : "#22c55e",
            fontWeight: 700,
          }}
        >
          ▶ Start (Space)
        </button>

        <button
          onClick={stopRecording}
          disabled={!recording || connectingRef.current}
          style={{
            padding: 14,
            borderRadius: 12,
            background: "#ef4444",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          ⏹ Stop (Esc)
        </button>

        <div>
          <div style={{ fontSize: 13, color: "#a1a1aa" }}>Past Messages</div>
          {finalMessages.map((m, i) => (
            <div key={i} style={{ fontSize: 13, marginTop: 6 }}>
              {m}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, padding: 32 }}>
        <h1>🎙 Live Transcription</h1>

        <div
          ref={chatRef}
          style={{
            marginTop: 20,
            height: "calc(100vh - 140px)",
            overflowY: "auto",
          }}
        >
          {finalMessages.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              {m}
            </div>
          ))}

          {liveText && (
            <div style={{ opacity: 0.7 }}>
              {liveText}
              <span> ▍</span>
            </div>
          )}

          {recording && (
            <div style={{ color: "#22c55e", marginTop: 10 }}>
              ● Listening…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
