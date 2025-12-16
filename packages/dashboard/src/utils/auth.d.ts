import React from 'react';
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}
interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => void;
}
export declare const useAuth: () => AuthContextType;
interface AuthProviderProps {
    children: React.ReactNode;
}
export declare const AuthProvider: React.FC<AuthProviderProps>;
export {};
