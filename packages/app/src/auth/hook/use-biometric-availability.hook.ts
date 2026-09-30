import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { authService } from '../service/auth.service';

const biometricAvailabilityAtom = appAtomRuntime.atom(authService.getBiometricTypes());

const LOADING_BIOMETRIC_AVAILABILITY = {
    isTouchIdAvailable: false,
    isFaceIdAvailable: false,
    isSomeAvailable: false,
    isLoading: true
};

export const useBiometricAvailability = () =>
    AsyncResult.getOrElse(useAtomValue(biometricAvailabilityAtom), () => LOADING_BIOMETRIC_AVAILABILITY);
