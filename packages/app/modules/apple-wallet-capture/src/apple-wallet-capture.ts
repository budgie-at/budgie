import { requireNativeModule } from 'expo';

// eslint-disable-next-line lingui/no-unlocalized-strings -- Native module identifier registered by AppleWalletCaptureModule
const AppleWalletCapture = requireNativeModule<Record<string, never>>('AppleWalletCapture');

export default AppleWalletCapture;
