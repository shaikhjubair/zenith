importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAiDgVsEkRmHCH_z3k4m2oOXE3pShBEC1w",
  authDomain: "zenith-ec759.firebaseapp.com",
  projectId: "zenith-ec759",
  storageBucket: "zenith-ec759.firebasestorage.app",
  messagingSenderId: "245428750866",
  appId: "1:245428750866:web:5763baa42ada7d2666a6cb"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();
