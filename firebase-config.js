// Config del proyecto de Firebase de Saint Latte (Nutrias).
// El apiKey es público a propósito — el control de acceso real vive en las
// Firestore Security Rules, no en ocultar este archivo.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAY5iFxHoAlTV_rB31ifVKY3XiGS7pUFvs',
  authDomain: 'lealtad-sl.firebaseapp.com',
  projectId: 'lealtad-sl',
  storageBucket: 'lealtad-sl.firebasestorage.app',
  messagingSenderId: '845317157649',
  appId: '1:845317157649:web:b5af1a6b21d79167f0d2b0',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
