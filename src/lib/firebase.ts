import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { GeneratedPost, SocialAccountConfig, AutomationRule } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseDb(): Firestore | null {
  if (db) return db;
  
  try {
    // Attempt to load configuration
    const config = (window as unknown as { __FIREBASE_CONFIG__?: Record<string, string> }).__FIREBASE_CONFIG__ || {
      projectId: 'ai-studio-3228ebce-75aa-4a6c-b2fb-383f84ca01e1',
      authDomain: 'ai-studio-3228ebce-75aa-4a6c-b2fb-383f84ca01e1.firebaseapp.com',
    };

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    db = getFirestore(app);
    return db;
  } catch (err) {
    console.warn('Firestore initialization fallback to local state:', err);
    return null;
  }
}

// Local Storage Fallback helpers if Firestore isn't connected
const LOCAL_STORAGE_KEY_POSTS = 'social_spark_posts_v1';
const LOCAL_STORAGE_KEY_ACCOUNTS = 'social_spark_accounts_v1';
const LOCAL_STORAGE_KEY_RULES = 'social_spark_rules_v1';

export async function savePostToDb(post: Partial<GeneratedPost>): Promise<string> {
  const firestore = getFirebaseDb();
  const newId = post.id || 'post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  
  const postData = {
    ...post,
    id: newId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (firestore) {
    try {
      const colRef = collection(firestore, 'posts');
      const docRef = await addDoc(colRef, postData);
      return docRef.id;
    } catch (err) {
      console.warn('Error saving to Firestore, caching locally:', err);
    }
  }

  // Fallback to localStorage
  const existing = getLocalPosts();
  const index = existing.findIndex(p => p.id === newId);
  if (index >= 0) {
    existing[index] = { ...existing[index], ...(postData as GeneratedPost) };
  } else {
    existing.unshift(postData as GeneratedPost);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(existing));
  return newId;
}

export async function fetchPostsFromDb(): Promise<GeneratedPost[]> {
  const firestore = getFirebaseDb();
  if (firestore) {
    try {
      const colRef = collection(firestore, 'posts');
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as GeneratedPost));
      }
    } catch (err) {
      console.warn('Error reading from Firestore, fallback to local storage:', err);
    }
  }
  return getLocalPosts();
}

export async function updatePostInDb(id: string, updates: Partial<GeneratedPost>): Promise<void> {
  const firestore = getFirebaseDb();
  if (firestore) {
    try {
      const docRef = doc(firestore, 'posts', id);
      await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
      return;
    } catch (err) {
      console.warn('Firestore update failed, updating local storage:', err);
    }
  }

  const existing = getLocalPosts();
  const updated = existing.map(p => p.id === id ? { ...p, ...updates } : p);
  localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(updated));
}

export async function deletePostFromDb(id: string): Promise<void> {
  const firestore = getFirebaseDb();
  if (firestore) {
    try {
      const docRef = doc(firestore, 'posts', id);
      await deleteDoc(docRef);
      return;
    } catch (err) {
      console.warn('Firestore delete failed, updating local storage:', err);
    }
  }

  const existing = getLocalPosts().filter(p => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEY_POSTS, JSON.stringify(existing));
}

function getLocalPosts(): GeneratedPost[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_POSTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalAccounts(): SocialAccountConfig[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_ACCOUNTS);
    if (raw) return JSON.parse(raw);
  } catch {}
  
  return [
    {
      platform: 'twitter',
      name: 'Tech Founder / Brand',
      handle: '@spark_tech',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      isConnected: true,
      autoPostEnabled: true,
      lastActive: 'Just now'
    },
    {
      platform: 'linkedin',
      name: 'Alex Rivera (Thought Leadership)',
      handle: 'in/alexrivera-tech',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      isConnected: true,
      autoPostEnabled: true,
      lastActive: '2h ago'
    },
    {
      platform: 'threads',
      name: 'Alex Rivera',
      handle: '@alex.rivera.dev',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
      isConnected: true,
      autoPostEnabled: false,
      lastActive: 'Yesterday'
    },
    {
      platform: 'instagram',
      name: 'Spark Studio',
      handle: '@sparkstudio_ai',
      avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
      isConnected: false,
      autoPostEnabled: false,
    },
    {
      platform: 'facebook',
      name: 'Social Spark Page',
      handle: 'facebook.com/socialsparkpage',
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&auto=format&fit=crop&q=80',
      isConnected: false,
      autoPostEnabled: false,
    }
  ];
}

export function saveLocalAccounts(accounts: SocialAccountConfig[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_ACCOUNTS, JSON.stringify(accounts));
}

export function getLocalRules(): AutomationRule[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_RULES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'rule_1',
      name: 'Auto-Post Product Launch Notes',
      docId: 'doc_demo_1',
      docTitle: 'Q3 Product Roadmap & Feature Highlights',
      triggerEvent: 'doc_updated',
      targetPlatforms: ['twitter', 'linkedin'],
      autoPublish: true,
      enabled: true,
      lastRun: '1 hour ago'
    }
  ];
}

export function saveLocalRules(rules: AutomationRule[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY_RULES, JSON.stringify(rules));
}
