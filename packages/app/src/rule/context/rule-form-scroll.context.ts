import { createContext } from 'react';

import type { RefObject } from 'react';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

export const RuleFormScrollContext = createContext<RefObject<KeyboardAwareScrollViewRef | null> | null>(null);
