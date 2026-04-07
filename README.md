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
- **Supabase Auth (email/password)** — optional: `/login` + sidebar when `NEXT_PUBLIC_SUPABASE_*` is set. When signed in, API routes use your Supabase user id as the in-memory chat partition (`auth:<userId>`) and **no 3-prompt limit**; data is still not persisted to Postgres.
- **OpenAI** — optional: set `OPENAI_API_KEY` to use the [Responses API](https://developers.openai.com/api/docs/quickstart) for real replies; without it, the app uses an offline mock stream.
- **Other LLM providers** (e.g. Gemini) — not wired in this repo
- **Supabase Realtime / Socket.io** — not used, cross-tab behaviour is browser-only.

## Stack (as in this repo)

| Assignment mention              | In this repo                        |
| ------------------------------- | ----------------------------------- |
| Next.js, React, TanStack Query  | Yes                                 |
| Tailwind                        | Yes                                 |
| REST API (App Router)           | Yes                                 |
| Postgres via Supabase           | **No** (in-memory)                  |
| Auth via Supabase (email)       | **Partial** (`/login`, middleware)  |
| Realtime via Supabase/Socket.io | **No** (BroadcastChannel + storage) |

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional `.env.local`:

- `OPENAI_API_KEY` — live model output
- `OPENAI_MODEL` — overrides default `gpt-4o-mini`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` — enable `/login` and session cookies

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
