import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { JournalInteraction } from './types';
import { stripUndefined } from './utils';

/**
 * References the user-isolated interactions subcollection:
 * /users/{userId}/interactions
 */
export function getUserInteractionsRef(userId: string) {
  return collection(db, 'users', userId, 'interactions');
}

export function getInteractionDocRef(userId: string, interactionId: string) {
  return doc(db, 'users', userId, 'interactions', interactionId);
}

/**
 * Saves or updates a journal interaction in Firestore with strict undefined stripping.
 */
export async function saveInteraction(
  userId: string,
  interaction: JournalInteraction
): Promise<void> {
  if (!userId) throw new Error('User ID is required to save interaction.');
  if (!interaction.id) throw new Error('Interaction ID is required.');

  const docRef = getInteractionDocRef(userId, interaction.id);
  const cleanPayload = stripUndefined({
    ...interaction,
    userId,
    updatedAt: Date.now(),
  });

  await setDoc(docRef, cleanPayload, { merge: true });
}

/**
 * Deletes an interaction document under the user's isolated subcollection.
 */
export async function deleteInteraction(
  userId: string,
  interactionId: string
): Promise<void> {
  if (!userId || !interactionId) return;
  const docRef = getInteractionDocRef(userId, interactionId);
  await deleteDoc(docRef);
}

/**
 * Updates favorite flag on an interaction.
 */
export async function toggleFavorite(
  userId: string,
  interactionId: string,
  isFavorite: boolean
): Promise<void> {
  if (!userId || !interactionId) return;
  const docRef = getInteractionDocRef(userId, interactionId);
  await updateDoc(docRef, { isFavorite });
}

/**
 * Subscribes to the real-time list of interactions for the authenticated user,
 * ordered by most recently updated/created.
 */
export function subscribeToUserInteractions(
  userId: string,
  onData: (interactions: JournalInteraction[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) {
    onData([]);
    return () => {};
  }

  const interactionsRef = getUserInteractionsRef(userId);
  const q = query(interactionsRef, orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const items: JournalInteraction[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as JournalInteraction);
      });
      onData(items);
    },
    (err) => {
      console.error('Error listening to user interactions:', err);
      if (onError) onError(err);
    }
  );

  return unsubscribe;
}
