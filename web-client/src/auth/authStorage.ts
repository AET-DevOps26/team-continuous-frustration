const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type StoredUser = {
    userId: string;
    username: string;
    email: string;
};

export function saveAuthData(token: string, user: StoredUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): StoredUser | null {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
        return null;
    }

    try {
        return JSON.parse(rawUser) as StoredUser;
    } catch {
        return null;
    }
}

export function clearAuthData() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}