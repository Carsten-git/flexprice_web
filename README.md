# FlexPrice Web Application

A web application for managing venue specials and pricing.

## Setup Instructions

1. Clone the repository
```bash
git clone <repository-url>
cd flexprice-web
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables
- Copy `.env.example` to `.env.local`
- Fill in the required environment variables:
  - `FIREBASE_PRIVATE_KEY`: Your Firebase Admin SDK private key
  - `FIREBASE_CLIENT_EMAIL`: Your Firebase Admin SDK client email
  - `NEXTAUTH_SECRET`: A random string for NextAuth.js
  - `NEXTAUTH_URL`: The URL of your application (http://localhost:3000 for development)
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps JavaScript API key

4. Set up Firebase
- Place your Firebase Admin SDK credentials file in the project root
- The file should be named `real-time-wtuahz-firebase-adminsdk-*.json`

5. Set up Google Maps API
- Go to the [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select an existing one
- Enable the "Maps JavaScript API"
- Create an API key and restrict it to your domain
- Add the API key to your `.env.local` file as `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

6. Run the development server
```bash
npm run dev
# or
yarn dev
```

## Security Notes

- Never commit sensitive files like `.env.local` or Firebase credentials
- Keep your Firebase credentials secure and never share them
- Restrict your Google Maps API key to your domain in production
- The `.gitignore` file is configured to exclude sensitive files

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/pages/api`: API routes
- `/src/lib`: Utility functions and configurations
- `/db`: SQLite database files

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
