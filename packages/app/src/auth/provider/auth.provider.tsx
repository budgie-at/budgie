import { ReactNode, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useSettingsContext } from '../../settings/context/settings.context';
import { AuthContext } from '../context/auth.context';

interface Props {
    readonly children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const { settings } = useSettingsContext();
    const { isPinEnabled } = settings;
    const [isUnlocked, setIsUnlocked] = useState(!isPinEnabled);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (!isPinEnabled) {
                setIsUnlocked(true);
            }

            if (nextAppState === 'background' || nextAppState === 'inactive') {
                setIsUnlocked(false);
            }
        });

        return () => void subscription.remove();
    }, [isPinEnabled]);

    const value = { isUnlocked, setIsUnlocked };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
