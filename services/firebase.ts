import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth'; 
import { AppData, BackupEntry } from '../types';
import firebaseConfig from '../firebase-applet-config.json';

// 1. Your Firebase Configuration
// Firebase configuration is loaded from firebase-applet-config.json managed by the system.

// 2. Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const DOC_PATH = 'portal/data';

let isOffline = false;

// 3. Auto-Authenticate
signInAnonymously(auth).catch(console.error);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
      isOffline = true;
    }
  }
}
testConnection();

// 4. Real-time Subscription logic needed by App.tsx
export const subscribeToData = (
  onData: (data: AppData) => void,
  onError: (error: any) => void
) => {
  const docRef = doc(db, DOC_PATH);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as AppData;
      // Provide defaults if missing
      onData({
        ...data,
        students: data.students || [],
        attendance: data.attendance || {},
        systemLocked: data.systemLocked || false
      });
    } else {
      // Document doesn't exist yet, initialize it
      const initialData: AppData = { students: [], attendance: {}, systemLocked: false };
      setDoc(docRef, initialData).catch(onError);
      onData(initialData);
    }
  }, (error) => {
    isOffline = true;
    onError(error);
  });

  return unsubscribe;
};

export const saveData = async (data: AppData) => {
  const docRef = doc(db, DOC_PATH);
  await setDoc(docRef, data, { merge: true });
};

export const createCloudBackup = async (data: AppData, type: 'Auto' | 'Manual' = 'Manual') => {
  console.log(`Local backup created (${type})`);
  const historyKey = 'dps_backups_local';
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.unshift({
    timestamp: new Date().toISOString(),
    data: data,
    type: type,
    id: Math.random().toString(36).substr(2, 9)
  });
  localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 10)));
};

export const getCloudBackups = async (): Promise<Partial<BackupEntry>[]> => {
  const historyKey = 'dps_backups_local';
  return JSON.parse(localStorage.getItem(historyKey) || '[]');
};

export const getSyncStatus = () => !isOffline;
