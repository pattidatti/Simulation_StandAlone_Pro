import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
    onAuthStateChanged,
    signInAnonymously,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    linkWithCredential,
    EmailAuthProvider,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { ref, onValue, set, get, update } from 'firebase/database';
import { simulationAuth, simulationDb } from './simulationFirebase';
import type { SimulationAccount } from './simulationTypes';

interface AuthContextType {
    user: User | null;
    account: SimulationAccount | null;
    loading: boolean;
    isAnonymous: boolean;
    error: string | null;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    checkNameAvailability: (name: string) => Promise<boolean>;
}

const SimulationAuthContext = createContext<AuthContextType | undefined>(undefined);

export const SimulationAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [account, setAccount] = useState<SimulationAccount | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAnonymous, setIsAnonymous] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(simulationAuth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAnonymous(currentUser.isAnonymous);

                // Fetch or Initialize Account
                const accountRef = ref(simulationDb, `simulation_accounts/${currentUser.uid}`);
                const unsubAccount = onValue(accountRef, async (snapshot) => {
                    if (snapshot.exists()) {
                        setAccount(snapshot.val());
                        setLoading(false);
                    } else {
                        // Initialize new account (should generally happen during register, but fallback here)
                        const newAccount: SimulationAccount = {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName || `Eventyrer_${currentUser.uid.slice(0, 4)}`,
                            globalXp: 0,
                            globalLevel: 1,
                            totalGoldEarned: 0,
                            unlockedAchievements: [],
                            characterHistory: [],
                            lastActive: Date.now()
                        };
                        await set(accountRef, newAccount);
                        setAccount(newAccount);
                        setLoading(false);
                    }
                });
                return () => unsubAccount();
            } else {
                // Anonymous sign in if no user
                setIsAnonymous(true);
                try {
                    await signInAnonymously(simulationAuth);
                } catch (err: any) {
                    console.error("Auth failed:", err);
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (email: string, pass: string) => {
        setError(null);
        try {
            await signInWithEmailAndPassword(simulationAuth, email, pass);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const checkNameAvailability = async (name: string): Promise<boolean> => {
        const cleanName = name.trim().toLowerCase();
        if (!cleanName || cleanName.length < 3) return false;
        const nameRef = ref(simulationDb, `simulation_reserved_names/${cleanName}`);
        const snap = await get(nameRef);
        return !snap.exists();
    };

    const register = async (email: string, pass: string, displayName: string) => {
        setError(null);
        const cleanName = displayName.trim();
        const lowerName = cleanName.toLowerCase();

        try {
            // 1. Check name uniqueness
            const available = await checkNameAvailability(cleanName);
            if (!available) throw new Error("Navnet er allerede tatt.");

            if (user && user.isAnonymous) {
                // Link current anonymous account
                const credential = EmailAuthProvider.credential(email, pass);
                await linkWithCredential(user, credential);

                // Update display name and reserve it
                const updates: any = {};
                updates[`simulation_accounts/${user.uid}/displayName`] = cleanName;
                updates[`simulation_reserved_names/${lowerName}`] = user.uid;
                await update(ref(simulationDb), updates);
            } else {
                // Traditional registration
                const result = await createUserWithEmailAndPassword(simulationAuth, email, pass);
                const updates: any = {};
                updates[`simulation_reserved_names/${lowerName}`] = result.user.uid;

                // Initialize account
                const newAcc: SimulationAccount = {
                    uid: result.user.uid,
                    displayName: cleanName,
                    globalXp: 0,
                    globalLevel: 1,
                    totalGoldEarned: 0,
                    unlockedAchievements: [],
                    characterHistory: [],
                    lastActive: Date.now()
                };
                updates[`simulation_accounts/${result.user.uid}`] = newAcc;
                await update(ref(simulationDb), updates);
            }
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    const logout = async () => {
        await signOut(simulationAuth);
    };

    const resetPassword = async (email: string) => {
        try {
            await sendPasswordResetEmail(simulationAuth, email);
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return (
        <SimulationAuthContext.Provider value={{
            user, account, loading, isAnonymous, error,
            login, register, logout, resetPassword, checkNameAvailability
        }}>
            {children}
        </SimulationAuthContext.Provider>
    );
};

export const useSimulationAuth = () => {
    const context = useContext(SimulationAuthContext);
    if (!context) {
        throw new Error('useSimulationAuth must be used within a SimulationAuthProvider');
    }
    return context;
};
