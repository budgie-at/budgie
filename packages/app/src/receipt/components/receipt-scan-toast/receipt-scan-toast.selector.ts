import type { ReceiptScanToastStatusEnum } from '../../enum/receipt-scan-toast-status.enum';

export const ReceiptScanToastSelector = {
    Toast: (status: ReceiptScanToastStatusEnum) => `ReceiptScanToast.${status}` as const
} as const;
