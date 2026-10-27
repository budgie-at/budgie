import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isPositiveNumber } from '@rnw-community/shared';

import { pinLockoutRemainingMillisAtom } from '../constant/pin-lockout-remaining-millis-atom.constant';
import { formatPinLockoutTime } from '../utils/format-pin-lockout-time.util';

export const usePinError = () => {
    const { t } = useLingui();
    const [error, setError] = useState<string | null>(null);
    const remainingMillis = AsyncResult.getOrElse(useAtomValue(pinLockoutRemainingMillisAtom), () => 0);
    const refreshLockout = useAtomRefresh(pinLockoutRemainingMillisAtom);
    const isLockedOut = isPositiveNumber(remainingMillis);
    const time = formatPinLockoutTime(remainingMillis);

    return {
        clearError: () => void setError(null),
        error: isLockedOut ? t`Too many attempts. Try again in ${time}` : error,
        isLockedOut,
        reportIncorrectPin: () => {
            setError(t`Incorrect PIN`);
            refreshLockout();
        }
    };
};
