# Hey-skillspoon

> **Full‑stack** Next.js + Node/Express + MongoDB application

&#x20;&#x20;

---
## Environment variables

Create the files as described below and populate them (don't commit secrets to git).

### Frontend (frontend/.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### Backend (backend/.env)

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/Hey-skillspoon

# SMTP (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=MAIL
SMTP_PASS=PASSWORD
SMTP_FROM="Skillspoon <skillspoon.io@gmail.com>"

# App
PORT=3001

# JWT
JWT_SECRET=YOUR_SECRET_KEY
```

**Security note:** For Gmail SMTP you may need to use an app password (if 2FA is enabled) or configure the account to allow SMTP. Prefer using a dedicated mail provider (SendGrid, Mailgun) for production.

---

## Quick start (local)

Make sure you have Node.js and MongoDB installed locally.

```bash
# Clone
git clone https://github.com/skillspoonio-star/Hey-skillspoon.git
cd skillspoon

# Frontend
cd frontend
npm install
# create frontend/.env.local with NEXT_PUBLIC_BACKEND_URL

# Backend
cd ../backend
npm install
# create backend/.env with values shown above

npm run dev        # or: node index.js / nodemon index.js depending on scripts

