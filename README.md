# MeetUp — Full-Stack Video Conferencing App

## A Zoom-style video meeting platform built from scratch with the MERN stack + Socket.io + WebRTC.

## Users can register, add friends, schedule meetings, invite participants, join rooms, chat, share screens, record locally, and receive real-time notifications.

# 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Build Journey — Step by Step](#-build-journey--step-by-step)
- [Features](#-features)
- [Known Limitations](#-known-limitations)
- [Deployment Notes](#-deployment-notes)
- [Running Locally](#-running-locally)

# 🛠 Tech Stack

- | Layer | Technology |
- | Frontend | React 18, Vite, Tailwind CSS, React Router, React Hot Toast |
- | Backend | Node.js, Express, MongoDB, Mongoose |
- | Real-time | Socket.io |
- | Media | WebRTC (browser native) |
- | Auth | JWT (HTTP-only cookie) + bcrypt |
- | File Uploads | Multer + ImageKit |
- | Email | Nodemailer (OTP) |
- | Recording | MediaRecorder API (local save) |

# 📁 Project Structure

## make this text editor preview to better visualize structure

MeetUp/
├── backend/
│ ├── src/
│ │ ├── config/
│ │ │ └── db.js
│ │ ├── controller/
│ │ │ ├── auth.controller.js
│ │ │ ├── user.controller.js
│ │ │ ├── meeting.controller.js
│ │ │ ├── participant.controller.js
│ │ │ ├── host.controller.js
│ │ │ ├── chat.controller.js
│ │ │ ├── friend.controller.js
│ │ │ ├── notification.controller.js
│ │ │ └── activity.controller.js
│ │ ├── middleware/
│ │ │ ├── auth.middleware.js
│ │ │ └── upload.middleware.js
│ │ ├── model/
│ │ │ ├── user.model.js
│ │ │ ├── meeting.model.js
│ │ │ ├── participant.model.js
│ │ │ ├── chatMessage.model.js
│ │ │ ├── friend.model.js
│ │ │ └── notification.model.js
│ │ ├── routes/
│ │ ├── socket/
│ │ │ └── socket.js
│ │ ├── utils/
│ │ │ ├── imagekit.js
│ │ │ ├── mailer.js
│ │ │ ├── notification.js
│ │ │ ├── reminder.js
│ │ │ └── scheduler.js
│ │ └── app.js
│ └── server.js
| └── .env
│
└── frontend/
├── src/
│ ├── api/
│ │ └── urlEndPoint.js
│ ├── components/
│ │ ├── layout/ (Sidebar, AppLayout)
│ │ ├── ui/ (Modal, CopyButton)
│ │ ├── meeting/ (CreateMeetingModal, InviteFriendsModal, etc.)
│ │ ├── meet/ (MeetingCard, MeetingDetailDrawer, ParticipantRow)
│ │ ├── room/ (VideoGrid, VideoTile, ControlBar, ChatPanel, ScreenShareView)
│ │ └── home/ (ActivityFeed)
│ ├── context/
│ │ ├── AuthContext.jsx
│ │ ├── MeetingContext.jsx
│ │ └── NotificationContext.jsx
│ ├── hooks/
│ │ ├── useMediaDevices.js
│ │ ├── useMediaSync.js
│ │ ├── useWebRTC.js
│ │ ├── useActiveSpeaker.js
│ │ ├── useMeetingEvents.js
│ │ ├── useRecorder.js
│ │ ├── useRoomShortcuts.js
│ │ ├── useParticipantToasts.js
│ │ ├── useSocketConnection.js
│ │ └── useChat.js
│ ├── lib/
│ │ ├── socket.js
│ │ ├── sound.js
│ │ └── webrtcConfig.js
│ ├── pages/
│ │ ├── Landing.jsx
│ │ ├── Login.jsx / SignUp.jsx
│ │ ├── Home.jsx
│ │ ├── Meet.jsx
│ │ ├── Friends.jsx
│ │ ├── Notifications.jsx
│ │ ├── Profile.jsx / Settings.jsx
│ │ ├── MeetingJoin.jsx
│ │ └── MeetingRoom.jsx
│ ├── services/
│ │ ├── auth.Service.js
│ │ ├── user.Service.js
│ │ ├── meeting.Service.js
│ │ ├── chat.Service.js
│ │ ├── friends.Service.js
│ │ ├── notifications.Service.js
│ │ └── activity.Service.js
│ └── App.jsx
└── .env

# 🔐 Environment Variables

## Backend `.env`

- PORT=3000
- NODE_ENV=development
- MONGO_URI=mongodb://localhost:27017/zoomclone
- JWT_SECRET=your_secret_key
- JWT_EXPIRE=7d
- FRONTEND_URI=http://localhost:5173

## ImageKit

- IMAGEKIT_PUBLIC_KEY=
- IMAGEKIT_PRIVATE_KEY=
- IMAGEKIT_URL_ENDPOINT=

## Mailer (OTP)

- SMTP_HOST=
- SMTP_PORT=
- SMTP_USER=
- SMTP_PASS=

## Frontend .env

- VITE_API_URL=http://localhost:3000

## TURN (required for production WebRTC)

- VITE_TURN_URL=
- VITE_TURN_URL_TCP=
- VITE_TURN_USERNAME=
- VITE_TURN_CREDENTIAL=

# 🚀 Build Journey — Step by Step

## Phase 1 — Foundations

### Step 1: Database connection

- Created config/db.js with retry logic and event listeners

- Connected Mongoose with maxPoolSize, serverSelectionTimeoutMS

### Step 2: User model + auth

- user.model.js — name, username, email, password (hashed), profileImage, bio, profession, OTP fields

- Auth flow via HTTP-only cookie

- protect middleware reads JWT from cookie, attaches req.user

### Step 3: Frontend scaffold

- React + Vite + Tailwind + React Router

- AuthContext with cookie-based session check

- RequireAuth / PublicOnly route guards

### Step 4: Landing + Home + Profile + Settings pages

- Landing with hero, features, CTA

- Sidebar with responsive mobile drawer

- Profile: name / profession / bio, avatar upload via ImageKit, email change with OTP, password change

- Settings: delete account

## Phase 2 — Meetings Core

### Step 5: Meeting model

- meeting.model.js — title, description, meetingCode (auto-generated), meetingLink, password, host, invitedUsers, scheduledAt, duration, status, allowEarlyJoin, isPrivate, waitingRoomEnabled, maxParticipants, isRecording

### Step 6: Meeting controller

- createMeeting — validate time, generate Zoom-style code (abc-defg-hij), hash password, save- host

- getMyMeetings — filter by host/participant/all, attach counts

- getMeetingById, updateMeeting, cancelMeeting, setRecording

### Step 7: Participant model (separate collection)

- participant.model.js — meeting ref, user ref, role, joinedAt, leftAt, isMuted, isCameraOff, isScreenSharing, sessions[]

- Unique index { meeting, user }

### Step 8: Join meeting flow

- joinMeeting — validate state, password check via bcrypt, capacity check, waiting-room logic

- Returns JOINED or WAITING with startsIn seconds

- Marks meeting ONGOING on first join

### Step 9: Waiting room (frontend)

- WaitingRoom.jsx with countdown timer, auto-retry on timer 0

- Host "Start meeting now" force-start endpoint POST /:meetingId/start-now

- Force-start resets scheduledAt to now so timer counts correctly

### Step 10: Create meeting modal

- Two modes: Start now / Schedule

- Post-create credentials card with copy buttons for link, code, password

## Phase 3 — Real-Time & WebRTC

### Step 11: Socket.io setup

- JWT auth on socket handshake (reads from cookie)

- Room per meeting: meeting:<id>

- Personal room per user: user:<id> (for notifications)

- Events: join-meeting, leave-meeting, participant-joined, participant-left, participant-state-changed

### Step 12: WebRTC signaling

- useWebRTC hook — one RTCPeerConnection per remote participant

- Pattern A signaling — existing participant initiates offer to new joiner

- ICE candidate queue to handle out-of-order candidates

- onconnectionstatechange / oniceconnectionstatechange with restart logic

### Step 13: Media devices hook

- useMediaDevices — camera + mic lifecycle, device enumeration, switch camera/mic

- Always requests at least one stream (fix for getUserMedia "at least one of audio and video must be requested")

### Step 14: Media sync hook

- useMediaSync — flips track.enabled on toggle, replaceTrack for screen share renegotiation

### Step 15: Meeting room UI

- MeetingRoom.jsx — orchestrator

- VideoGrid / VideoTile — adaptive grid

- ControlBar — mic, camera, screen share, chat, people, leave

- ParticipantsPanel — list with host menu (mute, kick, promote, stop-share)

- ChatPanel — socket-based messages

- Active speaker detection via Web Audio API

- Keyboard shortcuts (M, V, S, C, P, R, H, Esc)

- Sound toasts for join/leave

### Step 16: Screen share takeover

- When someone shares, ScreenShareView replaces the grid

- Big screen tile + thumbnail strip of others

- Other users' share buttons disabled

- Host can force-stop via POST /:meetingId/participants/:pid/stop-share

## Phase 4 — Collaboration

### Step 17: Chat persistence

- chatMessage.model.js — meeting, user, snapshot fields (senderName, senderUsername, senderProfileImage), message, isDeleted, type

- Socket send-chat saves then broadcasts

- REST endpoints for history + delete

- Cursor-based pagination

### Step 18: Participant history

- sessions[] array on participant doc — every join creates a new session, every leave closes one

- getParticipantHistory flattens sessions into rows

- Frontend tabs: Active / History

### Step 19: Friends system

- friend.model.js — from, to, status (PENDING/ACCEPTED/REJECTED/BLOCKED), message, respondedAt

- Controllers: send, respond, list friends, list requests, remove, search

- Frontend /friends page with tabs: Friends / Requests / Add

### Step 20: Notifications

- notification.model.js — user, type, title, body, from, link, meta, isRead

- createNotification helper — persists + pushes via socket to user:<id>

- Socket: personal room joined on connect

- Frontend NotificationContext — global list, unread count, socket listener

- /notifications page — filter unread, mark all read, clear read

- Sidebar bell badge

- Types: FRIEND_REQUEST, FRIEND_ACCEPTED, FRIEND_REJECTED, MEETING_INVITE, MEETING_STARTING, MEETING_CANCELLED

### Step 21: Meeting invites

- POST /:meetingId/invite — verify friends, avoid duplicates, send notifications

- DELETE /:meetingId/invite/:userId

- GET /:meetingId/invite/candidates — friends not yet invited

- InviteFriendsModal — searchable, multi-select

### Step 22: Reminder scheduler

- utils/reminder.js — scans for meetings starting in ≤ 5 min

- utils/scheduler.js — runs every 60s

- Idempotent via reminderSentAt flag on meeting

- Fires MEETING_STARTING to host + invited + past participants

- Reschedules reset the flag

### Step 23: Activity feed

- getActivityFeed — merges meetings, participations, friendships, notifications

- Sorted newest first, capped to 20

- ActivityFeed component with type-specific icons

### Step 24: Profile stats

- GET /api/user/stats — friends, meetings, unread notifications, upcoming events

- Home page shows real numbers with 60s polling

## Phase 5 — Polish

### Step 25: Recording

- useRecorder hook — MediaRecorder on local stream

- Auto-download .webm on stop

- Host-only recording control in ControlBar

- REC indicator in header
- ## But totally off now.

### Step 26: Mobile responsiveness

- Sidebar becomes a slide-in drawer

- Room panels become full-width overlays

- Control bar compacted

### Step 27: Keyboard shortcuts + sound

- Global room shortcuts

- Web Audio chirps for join/leave/message

- Sound preference toggle

### ✨ Features

Authentication

- Sign up, login, logout

- Forgot password with OTP

- Email change with OTP verification

- Password change

### Meetings

- Instant or scheduled creation

- Zoom-style meeting code (abc-defg-hij)

- Password-protected meetings

- Private meetings (invite-only)

- Waiting room with countdown

- Host force-start before scheduled time

- Auto-transitions to ONGOING at scheduled time

### Real-Time

    WebRTC mesh video/audio (up to ~6 participants)

- Mute/unmute, camera on/off

- Screen sharing with takeover view

- Host controls: mute, unmute, kick, promote/demote co-host, stop screen share

- Active speaker detection

- In-meeting chat with history

- Local recording

### Collaboration

- Friend system with requests

- Meeting invites with notifications

- Notification inbox with badge

- Reminder scheduler for upcoming meetings

- Activity feed

- Real stats dashboard

### Rooms

- Adaptive video grid

- Screen-share full takeover

- Chat panel

- Participants panel with live state

- Leave / end-for-all confirmation

# ⚠️ Known Limitations

## 🔴 WebRTC in Production Requires TURN

## 🟡 Mesh Topology Scales to ~6 Participants

Each user maintains N-1 peer connections. Beyond 6 participants, bandwidth and CPU become prohibitive. An SFU (mediasoup, LiveKit) is required for larger meetings.

## 🟡 Screen Share Recording

Recording only captures the local stream (camera + mic). Screen share content is not included in the recording. A composite canvas approach would be needed to record all participants + screen.

## 🟡 Notification Link Dead-ends

If a MEETING_INVITE notification is clicked after the meeting is cancelled, the user sees an error page. The notification is not auto-deleted.

# 🌐 Deployment Notes

## Render (Backend + Frontend both)

- Backend service — Node.js, root backend/, build npm install, start npm start
- Frontend service — Static site, root frontend/, build npm run build, publish dist
- Env vars on Render — all backend env + frontend VITE\_\* vars
- CORS — backend must allow the frontend Render URL
- Cookies — sameSite: "none", secure: true in production
- TURN — mandatory for WebRTC to work reliably

## WebRTC Deployment Checklist

- TURN server credentials configured
- Frontend served over HTTPS (mandatory for getUserMedia)
- Socket.io CORS allows the frontend origin
- webrtcConfig.js includes TURN entries
- Test on two different networks (WiFi vs mobile)

# 🏃 Running Locally

## Backend

- cd backend
- npm install
- npm run dev # starts on PORT (default 3000)

## Frontend

- cd frontend
- npm install
- npm run dev # starts on 5173

## Open http://localhost:5173

## MongoDB

Ensure MongoDB is running locally or use MongoDB Atlas. Update MONGO_URI in backend/.env.

# What to Build Next

- TURN integration — required for production WebRTC
- Cloud image storage — ImageKit/S3 upload
- Recurring meetings UI — schema supports it, no UI
- Email notifications — send emails for offline users
- Push notifications — Web Push API for browser notifications
- Breakout rooms — Zoom-style sub-meetings
- Waiting room admission — host must approve each joiner

# 📝 License

- Free to use, modify, and distribute.

# 🙏 Acknowledgments

## Built with:

- WebRTC
- Socket.io
- Mongoose
- Tailwind CSS
- Lucide Icons

## Last updated: 2026-10-14
