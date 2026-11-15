import { usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AppToastHost } from '../../@generic/component/app-toast-host/app-toast-host';
import { goBackOrReplace } from '../../@generic/utils/go-back-or-replace.util';
import { ForgotPinSheet } from '../../auth/components/forgot-pin-sheet/forgot-pin-sheet';
import { PinUnlock } from '../../auth/components/pin-unlock/pin-unlock';
import { useAuthContext } from '../../auth/context/auth.context';

export default function PinScreen() {
    const { isUnlocked } = useAuthContext();
    const [isRecovering, setIsRecovering] = useState(false);
    const replayBlockedNavigationRef = useRef<(() => void) | null>(null);

    const handleForgotPin = () => void setIsRecovering(true);
    const handleTryAgain = () => void setIsRecovering(false);

    usePreventRemove(!isUnlocked, ({ repeat }) => {
        replayBlockedNavigationRef.current = repeat;
    });

    useEffect(() => void Keyboard.dismiss(), []);

    useEffect(() => {
        if (!isUnlocked) {
            return;
        }

        if (isDefined(replayBlockedNavigationRef.current)) {
            replayBlockedNavigationRef.current();
        } else {
            goBackOrReplace('/');
        }
    }, [isUnlocked]);

    const content = isRecovering ? <ForgotPinSheet onTryAgain={handleTryAgain} /> : <PinUnlock onForgotPin={handleForgotPin} />;

    return (
        <>
            {content}
            <AppToastHost />
        </>
    );
}
