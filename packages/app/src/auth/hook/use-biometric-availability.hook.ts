import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { BiometricTypesInterface } from '../interface/biometric-types.interface';
import { AuthService } from '../service/auth.service';

const biometricAvailabilityAtom = appAtomRuntime.atom(Effect.flatMap(AuthService, authService => authService.getBiometricTypes()));

const LOADING_BIOMETRIC_AVAILABILITY: BiometricTypesInterface = {
    biometricKind: null,
    isSomeAvailable: false
};

export const useBiometricAvailability = () =>
    AsyncResult.getOrElse(useAtomValue(biometricAvailabilityAtom), () => LOADING_BIOMETRIC_AVAILABILITY);
