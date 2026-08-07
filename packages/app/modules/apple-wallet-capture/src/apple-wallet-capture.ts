import { requireNativeModule } from 'expo';

import type { WalletCaptureNativeModuleInterface } from '../../../src/wallet-capture/interface/wallet-capture-native-module.interface';

// eslint-disable-next-line lingui/no-unlocalized-strings -- Native module identifier registered by AppleWalletCaptureModule
export const appleWalletCaptureNativeModule = requireNativeModule<WalletCaptureNativeModuleInterface>('AppleWalletCapture');
