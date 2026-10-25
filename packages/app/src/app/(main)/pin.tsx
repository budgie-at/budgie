import { usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { AppToastHost } from '../../@generic/component/app-toast-host/app-toast-host';
import { ForgotPinSheet } from '../../auth/components/forgot-pin-sheet/forgot-pin-sheet';
import { PinUnlock } from '../../auth/components/pin-unlock/pin-unlock';
import { useAuthContext } from '../../auth/context/auth.context';

export default function PinScreen() {
    const { isUnlocked } = useAuthContext();
    const [isRecovering, setIsRecovering] = useState(false);

    const handleForgotPin = () => void setIsRecovering(true);
    const handleTryAgain = () => void setIsRecovering(false);

    usePreventRemove(!isUnlocked, emptyFn);

    useEffect(() => void Keyboard.dismiss(), []);

    const content = isRecovering ? <ForgotPinSheet onTryAgain={handleTryAgain} /> : <PinUnlock onForgotPin={handleForgotPin} />;

    return (
        <>
            {content}
            <AppToastHost />
        </>
    );
}
