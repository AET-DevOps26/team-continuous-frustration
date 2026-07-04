import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { getMe, logout as apiLogout, type MeResponse } from "@/api/auth";

type User = MeResponse;

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    updateUser: (user: User) => void;
    refetch: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refetch = useCallback(async () => {
        try {
            const res = await getMe();
            setUser(res.status === 200 ? res.data : null);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { refetch(); }, [refetch]);

    const logout = async () => {
        try {
            await apiLogout();
        } finally {
            setUser(null);
        }
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
