# Insta Growth Studio 📸

[![CI Pipeline](https://github.com/user/Insta/actions/workflows/ci.yml/badge.svg)](https://github.com/user/Insta/actions)
![Gemini AI Powered](https://img.shields.io/badge/Gemini_AI-Powered-8E44AD?style=for-the-badge&logo=google&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)

Insta Growth Studio is an AI-powered social media automation, caption generator, and Reels storyboard creation platform powered by `@google/genai` and Gemini 2.0 Flash.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[React + Motion Frontend] -->|REST / JSON| ExpressServer[Express Server - server.ts]
    ExpressServer -->|Security Middleware| Headers[Rate-Limit & CORS Headers]
    ExpressServer -->|/api/health| HealthCheck[Health Check Endpoint]
    ExpressServer -->|/api/gemini/ask| GeminiAsk[Gemini AI Ask Endpoint]
    ExpressServer -->|/api/captions/generate| CaptionGen[Viral Caption Generator]
    ExpressServer -->|/api/reels/storyboard| ReelStoryboard[Reels Storyboard Engine]
    GeminiAsk -->|@google/genai| GoogleGemini[Google Gemini 2.0 Flash]
    GeminiAsk -.->|Fallback Engine| Fallback[Simulated Content Engine]
```

---

## ✨ Features

- **Gemini Content Agent**: Endpoint `/api/gemini/ask` for customized social media strategy & prompt answering.
- **Viral Caption & Hashtag Generator**: Endpoint `/api/captions/generate` creating engaging copy and optimized tags.
- **15-Second Reels Storyboarder**: Endpoint `/api/reels/storyboard` generating scene-by-scene timing, visuals, and audio script.
- **Security & Headers**: Integrated CORS headers and rate-limiting headers.
- **Vitest Unit Test Suite**: Full coverage in `tests/api.test.ts`.
- **CI/CD Pipeline**: GitHub Actions workflow.

---

## 🔑 Environment Variables

```env
PORT=3000
GEMINI_API_KEY=your_google_gemini_api_key_here
```

| Variable | Required | Description | Default |
| :--- | :--- | :--- | :--- |
| `PORT` | No | Express server port | `3000` |
| `GEMINI_API_KEY` | Recommended | Google Gemini API key | `""` (Fallback active) |

---

## 📡 API Documentation

### 1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "ok",
  "service": "insta-backend",
  "version": "1.0.0",
  "timestamp": "2026-08-12T12:00:00.000Z",
  "gemini_configured": true
}
```

### 2. Gemini AI Ask Endpoint
- **Endpoint**: `POST /api/gemini/ask`
- **Request Body**:
```json
{
  "prompt": "How to increase Instagram engagement in 2026?",
  "systemInstruction": "You are a top Instagram growth strategist."
}
```

---

## ⚡ Quick Start

```bash
npm install
npm run dev
npm test
npm run build
```
