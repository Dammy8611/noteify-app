import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, orderBy, Timestamp, query } from 'firebase/firestore';
import type { Note } from '@/types';

type NoteData = Omit<Note, 'id' | 'createdAt'> & {
    createdAt?: any;
};

// Firestore converters to handle Timestamps
const noteConverter = {
    toFirestore: (note: NoteData) => {
        return {
            ...note,
            createdAt: note.createdAt || serverTimestamp()
        };
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

export const addNote = async (userId: string, noteData: Omit<Note, 'id' | 'createdAt'>): Promise<Note> => {
    const notesCollection = getNotesCollection(userId);
    const docRef = await addDoc(notesCollection, noteData);
    return {
        id: docRef.id,
        ...noteData,
        createdAt: new Date().toISOString(),
    };
};

export const updateNote = async (userId: string, noteId: string, noteData: Partial<Omit<Note, 'id' | 'createdAt'>>): Promise<void> => {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await updateDoc(noteRef, noteData);
};

export const deleteNoteFirestore = async (userId: string, noteId: string): Promise<void> => {
    const noteRef = doc(db, 'users', userId, 'notes', noteId);
    await deleteDoc(noteRef);
};
