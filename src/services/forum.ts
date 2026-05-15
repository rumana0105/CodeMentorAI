import { collection, addDoc, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, getDocs, limit } from "firebase/firestore";
import { db, auth } from "./firebase";
import { ForumPost, ForumReply } from "../types";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.log("Current User UID:", auth.currentUser?.uid);

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errInfo.error.toLowerCase().includes("permission") || errInfo.error.toLowerCase().includes("missing")) {
    throw new Error("Permission denied. Please login again.");
  }
  
  throw new Error(JSON.stringify(errInfo));
}

const FORUM_COLLECTION = "community";

export function subscribeToForum(callback: (posts: ForumPost[]) => void) {
  const q = query(collection(db, FORUM_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumPost));
    callback(posts);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, FORUM_COLLECTION);
  });
}

export async function createPost(post: Omit<ForumPost, "id" | "likes" | "replies">) {
  try {
    return await addDoc(collection(db, FORUM_COLLECTION), {
      ...post,
      likes: [],
      replies: []
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, FORUM_COLLECTION);
  }
}

export async function toggleLike(postId: string, userId: string, isLiked: boolean) {
  const postRef = doc(db, FORUM_COLLECTION, postId);
  try {
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FORUM_COLLECTION}/${postId}`);
  }
}

export async function addReply(postId: string, reply: ForumReply) {
  const postRef = doc(db, FORUM_COLLECTION, postId);
  try {
    await updateDoc(postRef, {
      replies: arrayUnion(reply)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${FORUM_COLLECTION}/${postId}`);
  }
}

export async function getLeaderboard() {
  const q = query(collection(db, "users"), orderBy("xp", "desc"), limit(10));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, "users");
    return [];
  }
}
