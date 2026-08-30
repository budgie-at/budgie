import { z } from 'zod';

import type { WalletCaptureNativeRecordSchema } from '../constant/wallet-capture-native-record-schema.constant';

export type WalletCaptureNativeRecordInterface = z.infer<typeof WalletCaptureNativeRecordSchema>;
