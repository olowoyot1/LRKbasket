{
  "name": "lrk-basket",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma db push --accept-data-loss --skip-generate && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.18.0",
    "@vercel/analytics": "^1.3.1",
    "@vercel/blob": "^0.27.1",
    "next": "14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "resend": "^4.0.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.15",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "prisma": "^5.18.0",
    "tailwindcss": "^3.4.9",
    "tsx": "^4.16.5",
    "typescript": "^5.5.4",
    "vitest": "^2.1.8"
  }
}
