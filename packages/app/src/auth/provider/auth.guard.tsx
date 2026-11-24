import { useAtomValue } from '@effect/atom-react/Hooks';
import { ReactNode } from 'react';

import { EmptyScreen } from '../../@generic/component/empty-screen/empty-screen';
import { isSettingsLoadingAtom } from '../../settings/constants/settings-atoms.constant';
import { AuthRedirectEffect } from '../components/auth-redirect-effect/auth-redirect-effect';

interface Props {
    readonly children: ReactNode;
}

export const AuthGuard = ({ children }: Props) => {
    const isLoading = useAtomValue(isSettingsLoadingAtom);

    if (isLoading) {
        return <EmptyScreen />;
    }

    return (
        <>
            <AuthRedirectEffect />
            {children}
        </>
    );
};
