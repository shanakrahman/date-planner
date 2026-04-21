# Day Adventure Planner — Setup Guide

## Prerequisites
Install Node.js (v20+) from https://nodejs.org — pick the LTS version.

## 1. Install dependencies
```bash
cd "date-planner"
npm install
```

## 2. Add your Anthropic API key
```bash
cp .env.local.example .env.local
```
Then open `.env.local` and replace `sk-ant-...` with your real key from https://console.anthropic.com/

## 3. Run the dev server
```bash
npm run dev
```
Open http://localhost:3000

## 4. Build for production
```bash
npm run build
npm start
```

## Deploy to Vercel (free)
1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import your repo
3. Add `ANTHROPIC_API_KEY` as an environment variable in Vercel settings
4. Deploy — done!
