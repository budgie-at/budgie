import { router, usePathname } from 'expo-router';
import { ReactNode, useEffect } from 'react';

import { EmptyScreen } from '../../@generic/component/empty-screen/empty-screen';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useAuthContext } from '../context/auth.context';

const PIN_PATH = '/pin';
const LOCKED_ALLOWED_PATHS: ReadonlySet<string> = new Set([PIN_PATH, '/import-backup-pin']);

interface Props {
    readonly children: ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
    const { isUnlocked } = useAuthContext();
    const { isLoading } = useSettingsContext();
    const pathname = usePathname();
    const isLockedOutsidePin = !isLoading && !isUnlocked && !LOCKED_ALLOWED_PATHS.has(pathname);
    const isUnlockedOnPin = isUnlocked && pathname === PIN_PATH;

    useEffect(() => {
        if (isLockedOutsidePin) {
            router.push(PIN_PATH);
        } else if (isUnlockedOnPin) {
            goBackOrReplace('/');
        }
    }, [isLockedOutsidePin, isUnlockedOnPin]);

    if (isLoading) {
        return <EmptyScreen />;
    }

    return children;
};
