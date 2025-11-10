import { auth } from "@/auth";
import { db } from "@/firebase";
import { collection, doc, writeBatch, serverTimestamp, addDoc, updateDoc, setDoc } from "firebase/firestore";

export interface CreateTrybeParams {
  trybeId?: string | null;
  trybeData: any;
  initialMessageText?: string | null;
}

export async function createTrybeWithMessage({ trybeId = null, trybeData, initialMessageText = null }: CreateTrybeParams) {
  // ensure signed in
  if (!auth.currentUser) {
    await new Promise<void>((resolve) => {
      const unsub = auth.onAuthStateChanged(() => { try { unsub(); } catch (e) {} ; resolve(); });
    });
  }
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');

  // ensure createdBy matches authenticated user
  if (!trybeData) trybeData = {};
  trybeData.createdBy = user.uid;

  if (!Number.isInteger(trybeData.attendees)) trybeData.attendees = 1;
  if (!Array.isArray(trybeData.attendeeIds)) trybeData.attendeeIds = [user.uid];
  if (!trybeData.attendeeIds.includes(user.uid)) trybeData.attendeeIds.push(user.uid);
  trybeData.createdAt = trybeData.createdAt || serverTimestamp();

  // choose doc ref (reserve id client-side so we can create message under it in same batch)
  const trybesCol = collection(db, 'trybes');
  const trybeRef = trybeId ? doc(db, 'trybes', String(trybeId)) : doc(trybesCol);

  // ensure the trybe has an id field (helps some client logic and rules)
  trybeData.id = trybeRef.id;

  // write the trybe first so security rules that read the parent trybe (via get())
  // will observe it on subsequent writes (many rules cannot see sibling writes in the same batch).
  // Use setDoc to create the document (merge semantics unnecessary here since we set id/fields above).
  await setDoc(trybeRef, trybeData as any);

  // If an initial message is requested, create it in a separate write after the trybe exists.
  if (initialMessageText && initialMessageText.length > 0) {
    try {
      const messagesColRef = collection(trybeRef, 'messages');
      await addDoc(messagesColRef, {
        senderId: user.uid,
        text: initialMessageText,
        createdAt: serverTimestamp(),
        system: true,
      } as any);

      // Best-effort: update parent trybe summary fields
      try {
        await updateDoc(trybeRef, { lastMessage: initialMessageText, lastMessageAt: serverTimestamp() } as any);
      } catch (e) {
        // ignore summary update failures (permissions etc.)
      }
    } catch (e) {
      // If the message write fails, we still successfully created the trybe; surface nothing here
      // so callers can attempt to add a message later. Logging handled by caller when needed.
    }
  }

  return trybeRef.id;
}
