import { NativeModule, requireOptionalNativeModule } from 'expo';

import type { ReceiptTextLineInterface } from '@budgie/import-export';

declare class ReceiptScannerNativeModule extends NativeModule {
    scan(): Promise<string[]>;
    recognize(uri: string): Promise<ReceiptTextLineInterface[]>;
}

export const ReceiptScannerModule = requireOptionalNativeModule<ReceiptScannerNativeModule>('ReceiptScanner');
