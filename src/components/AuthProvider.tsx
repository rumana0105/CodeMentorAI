import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db, signInWithGoogle, logout, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "../services/firebase";
import { getUserProgress, createUserProfile } from "../services/db";
import { UserProgress } from "../types";
import { onSnapshot, doc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  profile: UserProgress | null;
  loading: boolean;
  login: () => Promise<any>;
  loginWithEmail: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string, name: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const register = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    const userProfile = await createUserProfile(cred.user.uid, name, "");
    setProfile(userProfile);
    return cred;
  };

  const loginWithEmail = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (authUser) {
        // STEP 5: VERIFY COLLECTION ACCESS (Test manual write)
        try {
          await setDoc(doc(db, "test", "testDoc"), { ok: true });
          console.log("SUCCESS: Manual test write to 'test' collection succeeded.");
        } catch (testError) {
          console.error("FAILURE: Manual test write failed. Firestore might not be configured correctly.", testError);
        }

        // First check if profile exists, if not create it
        let initialProfile = await getUserProgress(authUser.uid);
        if (!initialProfile) {
          try {
            initialProfile = await createUserProfile(
              authUser.uid, 
              authUser.displayName || authUser.email?.split('@')[0] || "Learner",
              authUser.photoURL || ""
            );
          } catch (e) {
            console.error("Failed to auto-create profile", e);
          }
        }
        setProfile(initialProfile);

        // Start real-time listener
        unsubProfile = onSnapshot(doc(db, "users", authUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setProfile({ userId: snapshot.id, ...snapshot.data() } as UserProgress);
          }
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, login: signInWithGoogle, loginWithEmail, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
