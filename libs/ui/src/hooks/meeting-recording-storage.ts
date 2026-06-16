'use client';

const DB_NAME = 'meezy-recordings';
const DB_VERSION = 1;
const SESSION_STORE = 'sessions';
const CHUNK_STORE = 'chunks';
const CHUNK_SESSION_INDEX = 'sessionId';

export interface PersistedRecordingSession {
  sessionId: string;
  teamId: string;
  meetingId: string;
  title?: string;
  mimeType?: string;
  active: boolean;
  startedAt: string;
  elapsedMs: number;
  updatedAt: number;
}

export interface PersistedRecordingChunk {
  id: string;
  sessionId: string;
  index: number;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export function getRecordingSessionId(teamId: string, meetingId: string) {
  return `${teamId}:${meetingId}`;
}

function isIndexedDbAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function openRecordingDb() {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: 'sessionId' });
      }

      if (!db.objectStoreNames.contains(CHUNK_STORE)) {
        const chunkStore = db.createObjectStore(CHUNK_STORE, { keyPath: 'id' });
        chunkStore.createIndex(CHUNK_SESSION_INDEX, 'sessionId');
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function savePersistedRecordingSession(
  session: PersistedRecordingSession
) {
  const db = await openRecordingDb();
  if (!db) return;

  try {
    const transaction = db.transaction(SESSION_STORE, 'readwrite');
    transaction.objectStore(SESSION_STORE).put(session);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function getPersistedRecordingSession(
  sessionId: string
): Promise<PersistedRecordingSession | null> {
  const db = await openRecordingDb();
  if (!db) return null;

  try {
    const transaction = db.transaction(SESSION_STORE, 'readonly');
    const result = await requestToPromise<PersistedRecordingSession | undefined>(
      transaction.objectStore(SESSION_STORE).get(sessionId)
    );
    return result ?? null;
  } finally {
    db.close();
  }
}

export async function savePersistedRecordingChunk(params: {
  sessionId: string;
  index: number;
  blob: Blob;
  mimeType: string;
}) {
  const db = await openRecordingDb();
  if (!db) return;

  const { sessionId, index, blob, mimeType } = params;

  try {
    const transaction = db.transaction(CHUNK_STORE, 'readwrite');
    const chunk: PersistedRecordingChunk = {
      id: `${sessionId}:${index}`,
      sessionId,
      index,
      blob,
      mimeType,
      createdAt: Date.now(),
    };

    transaction.objectStore(CHUNK_STORE).put(chunk);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function getPersistedRecordingChunks(sessionId: string) {
  const db = await openRecordingDb();
  if (!db) return [];

  try {
    const transaction = db.transaction(CHUNK_STORE, 'readonly');
    const index = transaction.objectStore(CHUNK_STORE).index(CHUNK_SESSION_INDEX);
    const chunks = await requestToPromise<PersistedRecordingChunk[]>(
      index.getAll(sessionId)
    );

    return chunks.sort((a, b) => a.index - b.index);
  } finally {
    db.close();
  }
}

export async function clearPersistedRecordingSession(sessionId: string) {
  const chunks = await getPersistedRecordingChunks(sessionId);
  const db = await openRecordingDb();
  if (!db) return;

  try {
    const transaction = db.transaction(
      [SESSION_STORE, CHUNK_STORE],
      'readwrite'
    );
    transaction.objectStore(SESSION_STORE).delete(sessionId);

    const chunkStore = transaction.objectStore(CHUNK_STORE);
    chunks.forEach((chunk) => {
      chunkStore.delete(chunk.id);
    });

    await transactionDone(transaction);
  } finally {
    db.close();
  }
}
