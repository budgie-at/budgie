import * as Effect from 'effect/Effect';
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import type { WalletCaptureNativeModuleInterface } from '../../../src/wallet-capture/interface/wallet-capture-native-module.interface';

export const appleWalletCaptureNativeModule = Effect.sync(() =>
    Platform.OS === 'ios' ? requireOptionalNativeModule<WalletCaptureNativeModuleInterface>('AppleWalletCapture') : null
);
