import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import { app } from "../server";

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 3000;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

describe("Insta Backend API Tests", () => {
  it("GET /api/health returns 200 OK and headers", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("service", "insta-backend");
    expect(res.headers.get("x-ratelimit-limit")).toBeDefined();
  });

  it("POST /api/gemini/ask returns 400 Bad Request when prompt is empty", async () => {
    const res = await fetch(`${baseUrl}/api/gemini/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error", "Bad Request");
  });

  it("POST /api/gemini/ask returns viral answer", async () => {
    const res = await fetch(`${baseUrl}/api/gemini/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Generate reel idea for fitness coaching" })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("answer");
    expect(body).toHaveProperty("status");
  });

  it("GET /api/templates/trending returns templates array", async () => {
    const res = await fetch(`${baseUrl}/api/templates/trending`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("templates");
    expect(Array.isArray(body.templates)).toBe(true);
  });

  it("GET /api/invalid returns 404", async () => {
    const res = await fetch(`${baseUrl}/api/invalid`);
    expect(res.status).toBe(404);
  });
});
