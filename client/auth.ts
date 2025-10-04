import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { app } from "./firebase";

export const auth = getAuth(app);

// Google login
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  return user;
}

// Email signup
export async function signUpWithEmail(email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  return user;
}

// Email login
export async function loginWithEmail(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// Logout
export function logout() {
  return signOut(auth);
}

// Subscribe to auth state (optional helper)
export function onUserChanged(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}