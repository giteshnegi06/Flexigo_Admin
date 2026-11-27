# Flexigo_Admin: FlexiGo Stays admin panel

The private admin panel for **FlexiGo Stays**, three holiday homes in Shimla run by Flexigo Holidays. The host signs in here to:

- see new booking requests, update their status and export them to CSV
- change each home's prices, minimum stay and details
- block or free nights on the calendar
- add or remove the holidays shown in the website's date picker

It talks only to the FlexiGo Stays backend API ([Flexigo_Backend](https://github.com/giteshnegi06/Flexigo_Backend)), and is kept separate from the guest website ([Flexigo_Web](https://github.com/giteshnegi06/Flexigo_Web)).

## Built with

- [React 19](https://react.dev) and [React Router](https://reactrouter.com), built with [Vite](https://vite.dev)
- TypeScript and [Tailwind CSS 4](https://tailwindcss.com), in the same colours as the website
- [Lucide](https://lucide.dev) icons

## Getting started

You need Node.js 20 or newer, and the backend API running (by default at `http://localhost:4000`).

```bash
npm install
cp .env.example .env.local   # then set the API address if it is not localhost:4000
npm run dev                  # http://localhost:5173
```

Sign in with the `ADMIN_PASSWORD` set in the backend's settings. The session is kept only until the browser tab closes.

### Settings (`.env.local`)

| Name | What it is |
| --- | --- |
| `VITE_API_URL` | Address of the backend API, for example `http://localhost:4000` |

`VITE_API_URL` is built into the app, so set it before building (on Vercel: Project Settings > Environment Variables) and redeploy after changing it.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built app locally |
| `npm run typecheck` | Check the TypeScript |

## Deploying on Vercel

1. Import this repository as a new Vercel project (Vercel detects Vite).
2. Add `VITE_API_URL` with the deployed backend address, then deploy.
3. In the **backend** project's settings, set `ADMIN_URL` to this admin panel's address so the API accepts its requests, and redeploy the backend.

`vercel.json` sends every path to `index.html`, so pages like `/enquiries` also work when opened directly or refreshed.

## Folder layout

```
src/
  main.tsx            routes and sign-in guard
  components/         layout with the side menu, WhatsApp icon
  pages/              Login, Dashboard, Enquiries, Homes, Calendar, Holidays
  lib/api.ts          calls to the backend and shared types
```
