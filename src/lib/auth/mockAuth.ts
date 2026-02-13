// Mock authentication service - temporary until Supabase is configured
import { useRouter } from "next/navigation";

export interface MockUser {
    id: string;
    email: string;
    username: string;
    territory_id: string;
    college_name: string;
    created_at: string;
}

const USERS_KEY = 'mind_flayer_users';
const CURRENT_USER_KEY = 'mind_flayer_current_user';

export const mockAuth = {
    // Sign up a new user
    signUp: async (email: string, password: string, metadata: { username: string; territory_id: string; college_name: string }) => {
        // Get existing users
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as MockUser[];

        // Check if email already exists
        if (users.find(u => u.email === email)) {
            return { data: null, error: { message: 'User already exists with this email' } };
        }

        // Create new user
        const newUser: MockUser = {
            id: `user_${Date.now()}`,
            email,
            username: metadata.username,
            territory_id: metadata.territory_id,
            college_name: metadata.college_name,
            created_at: new Date().toISOString(),
        };

        // Save user
        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));

        // Auto-login the user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));

        return {
            data: { user: newUser, session: { access_token: 'mock_token' } },
            error: null
        };
    },

    // Sign in existing user
    signIn: async (email: string, password: string) => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as MockUser[];
        const user = users.find(u => u.email === email);

        if (!user) {
            return { data: null, error: { message: 'Invalid email or password' } };
        }

        // Set current user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));

        return {
            data: { user, session: { access_token: 'mock_token' } },
            error: null
        };
    },

    // Get current user
    getCurrentUser: (): MockUser | null => {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem(CURRENT_USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    // Sign out
    signOut: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
        return { error: null };
    },

    // Check if user is authenticated
    isAuthenticated: (): boolean => {
        return mockAuth.getCurrentUser() !== null;
    }
};
