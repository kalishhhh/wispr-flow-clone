let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  mediaRecorder = new MediaRecorder(stream);
  chunks = [];

  mediaRecorder.ondataavailable = (e) => {
    chunks.push(e.data);
  };

  mediaRecorder.start();
  console.log("🎙️ Recording started");
}

export async function stopRecording() {
  if (!mediaRecorder) return null;

  return new Promise<Blob>((resolve) => {
    mediaRecorder!.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      console.log("🛑 Recording stopped", blob);
      resolve(blob);
    };

    mediaRecorder!.stop();
  });
}
