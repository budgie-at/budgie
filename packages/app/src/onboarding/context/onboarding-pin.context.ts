import { createContext, use } from 'react';

import { emptyFn } from '@rnw-community/shared';

import type { OnboardingPinContextInterface } from '../interface/onboarding-pin-context.interface';

export const OnboardingPinContext = createContext<OnboardingPinContextInterface>({ pin: null, setPin: emptyFn });

export const useOnboardingPinContext = () => use(OnboardingPinContext);
