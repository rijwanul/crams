# CRAMS – Course Registration and Advising Management System

A beginner-friendly full-stack web app to digitize course registration and advising at the university/department level.

## Features
- Role-based authentication (Student, Advisor, Admin)
- Course selection, approval, and waitlisting
- Admin course management
- Real-time seat tracking
- In-app notifications
- Analytics dashboard

## Tech Stack
- Frontend: React.js + Tailwind CSS
- Backend: Node.js (Express)
- Database: MongoDB Atlas
- Auth: JWT (role-based)

## Project Structure
```
crams/
├── client/   # React frontend
├── server/   # Express backend
├── .env.example
├── README.md
└── package.json
```

## Quick Start (Local)
1. Clone repo & copy `.env.example` to `.env` in `/server`.
2. Install dependencies:
   - `cd client && npm install`
   - `cd ../server && npm install`
3. Start backend: `npm start` in `/server`
4. Start frontend: `npm start` in `/client`

## Deployment (Render)
1. Push to GitHub
2. Create two Render web services (one for `/server`, one for `/client`)
3. Set env vars from `.env.example`
4. Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for DB

## API Endpoints
See `/server/routes/` for all endpoints.

## User Roles
- **Student**: Register, select courses, track status
- **Advisor**: Review/approve/reject student plans
- **Admin**: Manage courses, resolve conflicts, view analytics

## Sample Test Users
- Student: `student1@example.com` / `password123`
- Advisor: `advisor1@example.com` / `password123`
- Admin: `admin1@example.com` / `password123`

---

For full setup, deployment, and usage instructions, see below and code comments.
