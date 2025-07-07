import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, Timestamp, query, setDoc, getDoc } from 'firebase/firestore';
import type { Note } from '@/types';

type NoteData = Omit<Note, 'id' | 'createdAt'> & {
    createdAt?: any;
};

// Firestore converters to handle Timestamps
const noteConverter = {
    toFirestore: (note: NoteData) => {
        const data: any = { ...note };
        if (!note.createdAt) {
            data.createdAt = serverTimestamp();
        }
        if (note.isPublic === undefined) {
            data.isPublic = false;
        }
        return data;
    },
    fromFirestore: (snapshot: any, options: any): Note => {
        const data = snapshot.data(options);
        return {
            id: snapshot.id,
            title: data.title,
            content: data.content,
            categories: data.categories,
            // Convert Firestore Timestamp to ISO string for client-side use
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString(),
            isPublic: data.isPublic || false,
        };
    }
};

const getNotesCollection = (userId: string) => {
    return collection(db, 'users', userId, 'notes').withConverter(noteConverter as any);
};

export const getNotes = async (userId: string): Promise<Note[]> => {
    if (!userId) return [];
    const notesCollection = getNotesCollection(userId);
    const q = query(notesCollection, orderBy('createdAt', 'desc'));
    const notesSnapshot = await getDocs(q);
    return notesSnapshot.docs.map(doc => doc.data() as Note);
};

export const addNote = async (userId: string, noteData: Omit<Note, 'id' | 'createdAt' | 'isPublic'>): Promise<Note> => {
    const notesCollection = getNotesCollection(userId);
    const dataToSave = { ...noteData, isPublic: false };
    const docRef = await addDoc(notesCollection, dataToSave);
    return {
        id: docRef.id,
        ...dataToSave,
        createdAt: new Date().toISOString(),
    };
};

export const updateNote = async (userId: string, noteId: string, noteData: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> => {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, noteData);
};

export const deleteNoteFirestore = async (userId: string, noteId: string): Promise<void> => {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    // Also delete the shared link if it exists
    const shareRef = doc(db, 'sharedNotes', noteId);
    await deleteDoc(shareRef).catch(() => {}); // Ignore error if it doesn't exist
    await deleteDoc(noteRef);
};

// New functions for sharing
export const shareNote = async (userId: string, noteId: string): Promise<void> => {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, { isPublic: true });

    const shareRef = doc(db, 'sharedNotes', noteId);
    await setDoc(shareRef, { userId: userId, noteId: noteId });
}

export const unshareNote = async (userId: string, noteId: string): Promise<void> => {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, { isPublic: false });

    const shareRef = doc(db, 'sharedNotes', noteId);
    await deleteDoc(shareRef);
}

// Function to get a public note
export const getPublicNote = async (noteId: string): Promise<Note | null> => {
    if (!noteId) return null;
    const shareRef = doc(db, 'sharedNotes', noteId);
    const shareSnap = await getDoc(shareRef);

    if (!shareSnap.exists()) {
        return null;
    }

    const { userId } = shareSnap.data();
    if (!userId) {
        return null;
    }

    const noteRef = doc(db, 'users', userId, 'notes', noteId).withConverter(noteConverter as any);
    const noteSnap = await getDoc(noteRef);

    if (!noteSnap.exists() || !noteSnap.data().isPublic) {
        return null;
    }
    
    return noteSnap.data() as Note;
}