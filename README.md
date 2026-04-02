# Chatbot

ChatGPT-like demo application.

## Already implemented

- **Chat UI**
- **REST API**
- **Streaming**
- **Anonymous mode**
- **Cross-tab sync**
- **Attachments**
- **Session cookie**

## Not implemented yet (coming soon)

- **Postgres / Supabase** — data lives in a **process in-memory** store (`src/lib/chat-store/`) - resets when the dev server restarts.
- **Supabase Auth / Clerk** — no OAuth or email login yet.
- **External LLM** (OpenAI or Gemini)
- **Supabase Realtime / Socket.io** — not used, cross-tab behaviour is browser-only.

## Stack (as in this repo)

| Assignment mention              | In this repo                        |
| ------------------------------- | ----------------------------------- |
| Next.js, React, TanStack Query  | Yes                                 |
| Tailwind                        | Yes                                 |
| REST API (App Router)           | Yes                                 |
| Postgres via Supabase           | **No** (in-memory)                  |
| Auth via Supabase/Clerk         | **No**                              |
| Realtime via Supabase/Socket.io | **No** (BroadcastChannel + storage) |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Architecture

```text
src/
├── app/
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── hooks/
├── lib/
├── services/
└── types/
```

## API design

| Method | Path                    | Role                                                                                   |
| ------ | ----------------------- | -------------------------------------------------------------------------------------- |
| `GET`  | `/api/session`          | Anonymous session + remaining free prompts                                             |
| `GET`  | `/api/chats`            | List chats for current session                                                         |
| `POST` | `/api/chats`            | Create chat                                                                            |
| `GET`  | `/api/messages?chatId=` | List messages for a chat                                                               |
| `POST` | `/api/stream`           | Send user message, stream assistant reply (JSON errors for 4xx)                        |
| `POST` | `/api/upload`           | Multipart: `chatId`, `files[]` — stores attachments and adds a user message with files |

## Verification

```bash
npm run lint
npm run build
```

## Deployment Vercel

https://clone-of-chat-gpt-like-chatbot.vercel.app/
