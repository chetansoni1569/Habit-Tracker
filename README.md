# 📋 Habit Tracker

A complete, production-quality habit tracking web application built with React, TypeScript, and Firebase.

## Features

- **Authentication**: Google login + Email/Password registration & login
- **Habit Management**: Create, edit, delete, and reorder habits
- **Daily Tracking**: Interactive checkbox grid for marking daily habit completions
- **Analytics**: Daily progress, weekly progress, overall stats with donut chart
- **Per-habit Analysis**: Goal/Actual/Left breakdown with progress bars
- **Mental State Tracking**: Daily mood and motivation (1-10 scale) with charts
- **Top 10 Habits**: Ranked by completion percentage
- **Month Navigation**: Switch between months and years
- **Data Export**: Export habit data as CSV
- **Profile Management**: View/edit profile, upload photo
- **Responsive Design**: Desktop, tablet, and mobile support
- **Persistent Data**: All data stored in Firebase Firestore

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Firebase (Auth + Firestore)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Utilities**: date-fns
- **Routing**: React Router v7

## Setup

### 1. Clone and Install

```bash
cd Habit-Tracker
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable **Email/Password**
   - Enable **Google**
4. Enable **Firestore Database**:
   - Go to Firestore Database > Create database
   - Start in **production mode**
   - Copy the security rules from `firestore.rules` in this project
5. Get your web app credentials:
   - Go to Project Settings > General > Your apps
   - Click "Add app" > Web
   - Copy the Firebase config values

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Then edit `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 4. Deploy Firestore Security Rules

Copy the contents of `firestore.rules` to your Firebase Console:
- Go to Firestore Database > Rules
- Paste the rules and publish

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── components/
│   ├── auth/          # AuthPage, ProtectedRoute
│   ├── dashboard/     # DashboardPage, Header, Charts, Stats, TopNav
│   ├── habits/        # HabitTable, HabitManager
│   ├── analytics/     # AnalysisTable, TopHabits, MentalStateSection
│   ├── profile/       # ProfilePage
│   └── settings/      # SettingsPage
├── contexts/          # AuthContext, HabitContext
├── services/          # Firebase config, Firestore operations
├── types/             # TypeScript type definitions
├── utils/             # Calendar, analytics calculations, defaults
├── App.tsx            # Main app with routing
├── main.tsx           # Entry point
└── index.css          # Complete stylesheet
```

## Data Model (Firestore)

```
users/{userId}
  ├── name, email, username, photoURL, createdAt, updatedAt
  ├── habits/{habitId}
  │     └── name, emoji, frequency, active, order, createdAt, updatedAt
  ├── habitCompletions/{habitId_date}
  │     └── habitId, date, completed, createdAt, updatedAt
  └── mentalState/{date}
        └── date, mood, motivation, updatedAt
```

## Building for Production

```bash
npm run build
```

The output will be in the `dist/` directory.
