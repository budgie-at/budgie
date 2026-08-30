const normalizePart = (value: string | number) => String(value).replace(/[^a-zA-Z0-9]+/gu, '_');

export const WalletCaptureReviewCardSelector = {
    Card: (captureId: string) => `ApplePayCaptureSettings.ReviewCard.${normalizePart(captureId)}` as const,
    ImportButton: (captureId: string) => `ApplePayCaptureSettings.ImportButton.${normalizePart(captureId)}` as const,
    DismissButton: (captureId: string) => `ApplePayCaptureSettings.DismissButton.${normalizePart(captureId)}` as const,
    DuplicateTransactionLink: (transactionId: number) =>
        `WalletCaptureReviewCard.DuplicateTransactionLink.${normalizePart(transactionId)}` as const
} as const;
