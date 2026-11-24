import { useAtomValue } from '@effect/atom-react/Hooks';
import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { isSettingsLoadingAtom } from '../../../settings/constants/settings-atoms.constant';
import { useAuthContext } from '../../context/auth.context';

const PIN_PATH = '/pin';
const LOCKED_ALLOWED_PATHS: ReadonlySet<string> = new Set([PIN_PATH, '/import-backup-pin']);

export const AuthRedirectEffect = () => {
    const { isUnlocked } = useAuthContext();
    const isLoading = useAtomValue(isSettingsLoadingAtom);
    const pathname = usePathname();
    const isLockedOutsidePin = !isLoading && !isUnlocked && !LOCKED_ALLOWED_PATHS.has(pathname);

    useEffect(() => {
        if (isLockedOutsidePin) {
            router.push(PIN_PATH);
        }
    }, [isLockedOutsidePin, pathname]);

    return null;
};
