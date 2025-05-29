import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  app = initializeApp({
    credential: cert({
      projectId: 'real-time-wtuahz',
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
} else {
  app = getApp(); // Get the existing app
}

// Initialize Firestore
export const firestore = getFirestore(app); 