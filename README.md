# RoomRental — MERN Full-Stack Application

A room rental platform where **Owners** list rooms and **Renters** discover them, with booking requests, real-time chat, calls, email alerts and push notifications.

## Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18 (Vite), Tailwind CSS + shadcn-style UI, React Router v6, Redux Toolkit + RTK Query, Socket.io-client, Firebase FCM, Axios |
| Backend   | Node.js, Express, MongoDB (Mongoose), JWT (access + rotating refresh tokens), Socket.io, Firebase Admin, Multer + Cloudinary, Nodemailer |

## Project Structure

```
room-rental-app/
├── client/          # React frontend (Vite)
└── server/          # Node.js + Express REST API
```

## Prerequisites

- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

## Setup

### 1. Server

```bash
cd server
npm install
```

Edit `server/.env` and set at minimum:

```
MONGO_URI=mongodb://127.0.0.1:27017/room-rental-app
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CLIENT_URL=http://localhost:5173
```

```bash
npm run dev
```

API runs on http://localhost:5000 — health check: `GET /api/health`

### 2. Client

```bash
cd client
npm install
npm run dev
```

App runs on http://localhost:5173 (dev proxy forwards `/api` to port 5000, so auth cookies work seamlessly).

## API (Phase 1 — Auth)

| Method | Route                 | Access | Description |
|--------|-----------------------|--------|-------------|
| POST   | `/api/auth/register`  | Public | Register as OWNER or RENTER |
| POST   | `/api/auth/login`     | Public | Login, returns access token + sets refresh cookie |
| POST   | `/api/auth/refresh-token` | Cookie | Rotate refresh token, new access token |
| POST   | `/api/auth/logout`    | Cookie | Revoke session, clear cookie |
| GET    | `/api/auth/me`        | Bearer | Current user profile |

Security model:
- **Access token**: 15 min JWT, kept in memory only (never persisted client-side).
- **Refresh token**: 7-day JWT in an HTTP-only cookie scoped to `/api/auth`, hashed (SHA-256) and stored per-session server-side with rotation + reuse detection (a replayed token revokes all sessions).

## API (Phase 2 — Rooms & Bookings)

| Method | Route                          | Access        | Description |
|--------|--------------------------------|---------------|-------------|
| GET    | `/api/rooms`                   | Public        | Browse with filters: `q, city, minPrice, maxPrice, roomType, furnishing, preferredTenant, amenities, availability, sort, page, limit` |
| GET    | `/api/rooms/:id`               | Public (optionalAuth) | Room detail; `contactNumber` revealed only to owner or renters with an ACCEPTED request. Returns `myRequestStatus` |
| GET    | `/api/rooms/owner/my-rooms`    | Owner         | Own listings + pending request counts |
| POST   | `/api/rooms`                   | Owner         | Create listing (multipart/form-data, up to 10 images via Cloudinary) |
| PUT    | `/api/rooms/:id`               | Owner         | Update listing; `keepImages` array controls removals |
| PATCH  | `/api/rooms/:id/availability`  | Owner         | Toggle Available / Booked |
| DELETE | `/api/rooms/:id`               | Owner         | Delete listing (+ Cloudinary cleanup, auto-rejects pending requests) |
| POST   | `/api/bookings`                | Renter        | Send booking request `{ roomId, message }` |
| GET    | `/api/bookings/received`       | Owner         | Requests received |
| GET    | `/api/bookings/sent`           | Renter        | Requests sent with status |
| PUT    | `/api/bookings/:id/status`     | Owner         | Accept / Reject. Accepting books the room and auto-rejects other pending requests |
| DELETE | `/api/bookings/:id`            | Renter        | Cancel own pending request |

Image pipeline: Multer (memory storage, 5 MB/image, JPEG/PNG/WEBP only) → Cloudinary upload streams → `images[] { public_id, url }` on the Room document.

## API (Phase 3 — Chat & Calls)

| Method | Route                        | Access | Description |
|--------|------------------------------|--------|-------------|
| GET    | `/api/chat/rooms`            | Auth   | All conversations for the logged-in user |
| GET    | `/api/chat/:chatRoomId/messages` | Auth (member) | Paginated messages; marks received messages as seen |
| POST   | `/api/chat/send`             | Auth (member) | REST fallback for sending messages |
| GET    | `/api/calls/config`          | Auth   | Agora App ID |
| POST   | `/api/calls/initiate`        | Auth   | Validates an accepted booking exists, returns `{ appId, channelName }` |

**Socket.io events** (`/socket.io`, JWT via `auth.token`):
- Client → server: `send_message`, `message_seen`, `typing`, `call_user`, `call_response`, `call_ended`, `call_cancelled`
- Server → client: `new_message`, `messages_seen`, `user_typing`, `presence`, `incoming_call`, `call_response`, `call_ended`, `call_cancelled`

Chat rooms are created automatically when an owner **accepts** a booking request — chat and calling only exist between pairs with an accepted booking. Emails fire on: new booking request (→ owner), request accepted / rejected (→ renter). Gmail SMTP is configured via `EMAIL_USER` / `EMAIL_PASS` (app password). Without them, emails are skipped gracefully.

For calls, create a project at [Agora.io](https://www.agora.io/en/) and set `AGORA_APP_ID` in `server/.env`. Keep the primary certificate disabled for testing mode (no token required).

## API (Phase 4 — Notifications)

| Method | Route                            | Access | Description |
|--------|----------------------------------|--------|-------------|
| GET    | `/api/notifications`             | Auth   | Paginated history + `unreadCount` |
| GET    | `/api/notifications/unread-count`| Auth   | Badge count (polled every 60s) |
| POST   | `/api/notifications/save-token`  | Auth   | Register FCM device token |
| PUT    | `/api/notifications/read-all`    | Auth   | Mark all read |
| PUT    | `/api/notifications/:id/read`    | Auth   | Mark one read |
| DELETE | `/api/notifications/:id`         | Auth   | Delete notification |

**Push triggers** (`sendEachForMulticast`, invalid tokens auto-pruned, history persisted in Mongo):
- New booking request → owner
- Request accepted / rejected → renter
- New chat message → recipients who are offline (app in background)
- New room listed in a renter's saved city

Firebase setup: create a project at [Firebase Console](https://console.firebase.google.com), enable Cloud Messaging, and fill:
- `server/.env` → `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (from the service-account JSON)
- `client/.env` → copy `.env.example` to `.env` and fill all `VITE_FIREBASE_*` keys + `VITE_FIREBASE_VAPID_KEY` (Cloud Messaging → Web Push certificates)

Without Firebase config the app runs normally; pushes are skipped gracefully.

## Deployment

### 1. MongoDB Atlas

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and copy the connection string.
3. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) or restrict to your Render outbound IPs.

Set `MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/room-rental-app`

### 2. Backend on Render

1. Push this repo to GitHub, then create a **Web Service** on [render.com](https://render.com).
2. Settings: Root Directory `server`, Build `npm install`, Start `node server.js`, Instance: Free.
3. Environment variables (from `server/.env.example`): `MONGO_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL=https://<your-app>.vercel.app`, `NODE_ENV=production`, plus Cloudinary / Firebase / Email / Agora keys as configured.
4. `NODE_ENV=production` switches refresh cookies to `SameSite=None; Secure` — required for cross-site cookies from the Vercel domain.

### 3. Frontend on Vercel

1. Create a project on [vercel.com](https://vercel.com) with Root Directory `client` (framework auto-detected: Vite).
2. Environment variables (from `client/.env.example`):
   - `VITE_API_BASE_URL=https://<your-service>.onrender.com/api`
   - `VITE_SOCKET_URL=https://<your-service>.onrender.com`
   - All `VITE_FIREBASE_*` values + `VITE_FIREBASE_VAPID_KEY`
3. Deploy. Update the email template links in `server/utils/emailTemplates.js` and Firebase Auth authorized domains to your Vercel URL for production.

> Note: Render's free tier spins down after inactivity — the first request may take ~30s. For always-on APIs use a paid instance or Railway/Fly.io. For production calls, enable the Agora App Certificate and generate tokens server-side (add `agora-token` package).

## Build Roadmap

- [x] Phase 1 — Foundation: boilerplate, User model, JWT auth (access + refresh rotation), role-based protected routes (frontend + backend)
- [x] Phase 2 — Core: Room CRUD + filters/pagination, Cloudinary image uploads (Multer), booking request system (send / accept / reject / cancel), owner & renter dashboards
- [x] Phase 3 — Communication: Socket.io real-time chat (seen status, typing, presence, unread badges), Agora voice/video calls with incoming-call modal + fallback "Call Now", Nodemailer email alerts
- [x] Phase 4 — Notifications: Firebase FCM (service worker, token saving, multicast pushes, offline-only message pushes), Notification model, bell icon + drawer with read/unread state
- [x] Phase 5 — Polish: wishlist (heart toggles everywhere + dedicated page), profile editing with Cloudinary avatar upload, scroll/title polish, deployment guide

## API (Phase 5 — Wishlist & Profile)

| Method | Route                       | Access | Description |
|--------|-----------------------------|--------|-------------|
| GET    | `/api/wishlist`             | Renter | Saved rooms |
| POST   | `/api/wishlist/:roomId/toggle` | Renter | Add / remove a room |
| PUT    | `/api/auth/profile`         | Auth   | Update name/city/phone (+ multipart `avatar` image to Cloudinary) |

Room detail responses include `isWishlisted` for renters.
