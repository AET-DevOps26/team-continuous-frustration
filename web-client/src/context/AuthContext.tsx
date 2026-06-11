import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface User {
    id: string;
    email: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    updateUser: (user: User) => void;
    refetch: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API = import.meta.env.VITE_API_BASE_URL ?? "";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/v1/auth/me`, { credentials: "include" });
            setUser(res.ok ? await res.json() : null);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { refetch(); }, [refetch]);

    const logout = async () => {
        await fetch(`${API}/api/v1/auth/logout`, { method: "POST", credentials: "include" });
        setUser(null);
    };

    const updateUser = (u: User) => setUser(u);

    return (
        <AuthContext.Provider value={{ user, isLoading, isAuthenticated: user !== null, updateUser, refetch, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
