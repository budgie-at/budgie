import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AuthService } from './auth.service';

interface AuthContextType {
    isAuthenticated: boolean;
    isPinEnabled: boolean;
    loading: boolean;
    authenticate: () => void;
    logout: () => void;
    enablePin: (pin: string) => Promise<void>;
    disablePin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isPinEnabled, setIsPinEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    // Lock app when going to background (only if PIN is enabled)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [isPinEnabled]);

    const handleAppStateChange = useCallback(
        (nextAppState: AppStateStatus) => {
            if (isPinEnabled && (nextAppState === 'background' || nextAppState === 'inactive')) {
                setIsAuthenticated(false);
            }
        },
        [isPinEnabled]
    );

    const checkAuthStatus = async () => {
        const pinEnabled = await AuthService.isPinEnabled();
        setIsPinEnabled(pinEnabled);

        // If PIN is not enabled, automatically authenticate
        if (!pinEnabled) {
            setIsAuthenticated(true);
        }

        setLoading(false);
    };

    const authenticate = useCallback(() => {
        setIsAuthenticated(true);
    }, []);

    const logout = useCallback(() => {
        setIsAuthenticated(false);
    }, []);

    const enablePin = useCallback(async (pin: string) => {
        await AuthService.savePin(pin);
        await AuthService.setPinEnabled(true);
        setIsPinEnabled(true);
        setIsAuthenticated(true);
    }, []);

    const disablePin = useCallback(async () => {
        await AuthService.clearAuthData();
        setIsPinEnabled(false);
        setIsAuthenticated(true);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isPinEnabled,
                loading,
                authenticate,
                logout,
                enablePin,
                disablePin
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
