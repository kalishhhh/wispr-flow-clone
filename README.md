🗣️ Wispr Flow Clone (Tauri + Deepgram)

A functional Wispr Flow–style voice-to-text desktop application, built using Tauri, React, and Deepgram for real-time speech transcription.

This project focuses on implementing the core voice-to-text workflow with low latency, reliability, and native desktop performance, rather than pixel-perfect UI replication.

🎯 Project Goal

The goal of this project is to demonstrate the ability to:

Capture microphone audio in real time

Stream audio efficiently to a speech-to-text service

Receive and render live transcription results

Build a performant, cross-platform desktop application using modern tooling

🧱 Tech Stack
Desktop Framework

Tauri (Rust backend + WebView frontend)

Lightweight and secure alternative to Electron

Frontend

React + TypeScript

Vite for fast development

Custom UI components (push-to-talk, chat-style transcript view)

Audio Processing

Web Audio API

AudioWorkletNode for low-latency audio capture

16kHz Linear PCM audio stream (Deepgram compatible)

Speech-to-Text

Deepgram Streaming API

Real-time transcription via WebSocket

Supports interim (partial) and final transcription results

✅ Core Features Implemented
1️⃣ Push-to-Talk Voice Input

User-controlled start / stop recording

Clear recording state feedback

Safe lifecycle handling for repeated start/stop actions

2️⃣ Microphone Access & Audio Capture

Handles browser + OS microphone permissions

High-quality mono audio capture

Audio processed using AudioWorklet (modern & production-ready)

3️⃣ Real-Time Transcription

Audio streamed live to Deepgram over WebSocket

Low-latency transcription results

Supports interim (partial) transcription updates

4️⃣ Transcript UI

Live transcript rendered in real time

Chat-style layout inspired by Wispr Flow

Smooth auto-scrolling and message animations

5️⃣ Error Handling & Stability

Handles microphone permission failures

Graceful handling of network / API errors

Clean start/stop lifecycle to avoid broken sessions

🧠 Architecture Overview
Microphone
   ↓
AudioWorkletNode
   ↓ (16kHz PCM)
Frontend (React)
   ↓
Tauri invoke()
   ↓
Rust Backend
   ↓
Deepgram WebSocket API
   ↓
Live Transcription Events

🔊 Why AudioWorklet?

AudioWorklet provides:

Lower latency than ScriptProcessorNode

Better performance under load

Long-term browser support (recommended modern API)

This makes it suitable for production-grade real-time audio applications.

🌐 Language Support

Currently optimized for English

Deepgram supports multilingual transcription

Hindi / multilingual support can be enabled by adjusting the Deepgram language configuration in the backend

⚠️ Known Limitations

Background noise may occasionally trigger partial words
(expected behavior in real-time speech-to-text systems)

Automatic multilingual detection is not fully enabled yet

UI is functional but not intended to be a pixel-perfect Wispr Flow replica

🚀 Getting Started
Prerequisites

Node.js 18+

Rust toolchain

Tauri CLI

Deepgram API Key

Installation
git clone https://github.com/kalishhhh/wispr-flow-clone.git
cd wispr-flow-clone
npm install

Environment Setup

Create a .env file inside src-tauri/:

DEEPGRAM_API_KEY=your_api_key_here

Run in Development
npm run tauri dev

📌 Notes for Reviewers

Audio capture is implemented using AudioWorklet (src/audio/pcm-processor.js)

Audio is streamed at 16kHz Linear PCM

Designed with production reliability and clean lifecycle management in mind

📄 License

This project is intended for educational and evaluation purposes only and is not an official Wispr Flow product.
