# AI Asset Studio

AI Asset Studio is a private web tool for selecting part of an image, generating a styled asset with OpenAI, and downloading the result.

## Current App Flow

1. Upload or paste an image.
2. Select an area on the original image.
3. Choose result ratio, size, fit, and preset.
4. Use `Generate` for AI output or `Crop Only` for an exact crop.
5. Download or delete the result immediately.

## Local Development

Run backend and frontend separately:

```powershell
cd backend
npm.cmd run dev
```

```powershell
cd frontend
npm.cmd run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Private Web Service Mode

Build the frontend and backend:

```powershell
build-web-service.bat
```

Start the app as one local web service:

```powershell
start-web-service-local.bat
```

Open:

```text
http://127.0.0.1:3001
```

In real hosting, deploy the backend and serve the built frontend from the same server.

## Backend Environment

Create `backend/.env`:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_IMAGE_MODEL=gpt-image-1
APP_PASSWORD=your-private-password
AUTH_SECRET=choose-a-long-random-secret
PORT=3001
```

`APP_PASSWORD` protects the app with a simple private password. Keep `OPENAI_API_KEY` and `AUTH_SECRET` secret.

## Production Notes

- Set `NODE_ENV=production` on the hosting service.
- Set the environment variables on the server, not in frontend code.
- Do not expose your OpenAI API key in the browser.
- Use a private password even if you are the only user.

## Deploying to Vercel

This project includes Vercel support through:

- `vercel.json`
- `api/generate.ts`
- `api/auth/*`

Vercel will build the frontend from `frontend/` and serve API functions from `api/`.

### Vercel Project Settings

When creating the Vercel project, use these settings:

```text
Framework Preset: Other
Build Command: npm run vercel-build
Output Directory: frontend/dist
Install Command: npm install
```

### Vercel Environment Variables

Add these in Vercel Project Settings > Environment Variables:

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_IMAGE_MODEL=gpt-image-1
APP_PASSWORD=your-private-password
AUTH_SECRET=choose-a-long-random-secret
```

`APP_PASSWORD` is the password you enter when opening the deployed site.

### Notes

- The app runs at your Vercel URL, for example `https://your-project.vercel.app`.
- The OpenAI API key stays on Vercel server functions and is not exposed to the browser.
- `api/generate.ts` has `maxDuration` configured in `vercel.json` because image generation can take time.
