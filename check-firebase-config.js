// Quick script to test Firebase Anonymous Auth
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.VITE_FB_API_KEY || "AIzaSyCrUZenvUEPbAsZ2zXh27SuZAoBArvos5E",
  authDomain: process.env.VITE_FB_AUTH_DOMAIN || "instaspec-dev.firebaseapp.com",
  projectId: process.env.VITE_FB_PROJECT_ID || "instaspec-dev",
  storageBucket: process.env.VITE_FB_STORAGE_BUCKET || "instaspec-dev.firebasestorage.app",
  messagingSenderId: process.env.VITE_FB_MESSAGING_SENDER_ID || "847536725528",
  appId: process.env.VITE_FB_APP_ID || "1:847536725528:web:0d10c3c1d405a292482d6d"
};

console.log('🔥 Testing Firebase Configuration...\n');
console.log('Project ID:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log('✅ Firebase initialized\n');
console.log('🔐 Testing Anonymous Authentication...');

signInAnonymously(auth)
  .then((userCredential) => {
    console.log('\n✅ SUCCESS! Anonymous authentication is enabled!');
    console.log('User UID:', userCredential.user.uid);
    console.log('\n🎉 Your Firebase configuration is correct!');
    console.log('\nYou can now use the app. If you still see errors,');
    console.log('clear browser data (Ctrl+Shift+Delete) and reload.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ ERROR:', error.code);
    console.error('Message:', error.message);

    if (error.code === 'auth/operation-not-allowed') {
      console.error('\n⚠️  SOLUTION:');
      console.error('Anonymous authentication is NOT enabled in Firebase Console.');
      console.error('\n1. Go to: https://console.firebase.google.com/project/instaspec-dhw/authentication/providers');
      console.error('2. Click on "Anonymous" provider');
      console.error('3. Toggle "Enable" to ON');
      console.error('4. Click "Save"');
      console.error('5. Run this script again');
    }

    process.exit(1);
  });
