import { useEffect, useRef, useState } from "react";

export default function UiPreview() {
  const [liveText, setLiveText] = useState("");
  const [finalMessages, setFinalMessages] = useState<string[]>([]);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Demo-only fake transcription (UI testing)
  useEffect(() => {
    const demo = [
      "Hello everyone",
      "we are only testing the UI",
      "no backend involved",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= demo.length) {
        clearInterval(interval);
        setLiveText("");
        return;
      }

      // Live typing
      setLiveText(demo[i]);

      // Finalized message (simulating Whisper final result)
      setTimeout(() => {
        setFinalMessages((prev) => [...prev, demo[i]]);
        setLiveText("");
      }, 600);

      i++;
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [finalMessages, liveText]);

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
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Voice Control</h2>

        <button
          style={{
            padding: "14px",
            borderRadius: 12,
            background: "#22c55e",
            color: "#000",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          ▶ Start
        </button>

        <button
          style={{
            padding: "14px",
            borderRadius: 12,
            background: "#ef4444",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
          }}
        >
          ⏹ Stop
        </button>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 13,
              color: "#a1a1aa",
              marginBottom: 10,
            }}
          >
            Past Messages
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              maxHeight: "40vh",
              overflowY: "auto",
            }}
          >
            {finalMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#111",
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  animation: "fadeIn 0.25s ease-out",
                }}
              >
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        style={{
          flex: 1,
          padding: 32,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1 style={{ fontSize: 26, marginBottom: 16 }}>
          🎙 Live Transcription
        </h1>

        <div
          ref={chatRef}
          style={{
            flex: 1,
            padding: 20,
            background: "#111",
            borderRadius: 20,
            border: "1px solid #27272a",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {finalMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                background: "#1f2937",
                padding: "14px 18px",
                borderRadius: 16,
                maxWidth: "90%",
                lineHeight: 1.6,
                animation: "slideUpFade 0.35s ease-out",
              }}
            >
              {msg}
            </div>
          ))}

          {liveText && (
            <div
              style={{
                background: "#334155",
                padding: "14px 18px",
                borderRadius: 16,
                maxWidth: "90%",
                opacity: 0.9,
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            >
              {liveText}
              <span style={{ opacity: 0.6 }}> ▍</span>
            </div>
          )}

          <div style={{ color: "#22c55e", fontSize: 13 }}>
            ● Listening…
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
