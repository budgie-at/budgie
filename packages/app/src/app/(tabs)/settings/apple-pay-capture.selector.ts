const normalizePart = (value: string) => value.replace(/[^a-zA-Z0-9]+/gu, '_');

export const ApplePayCaptureSettingsSelector = {
    Container: 'ApplePayCaptureSettings.Container',
    InstructionsGuideLink: 'ApplePayCaptureSettings.InstructionsGuideLink',
    OpenShortcutsButton: 'ApplePayCaptureSettings.OpenShortcutsButton',
    SetupCard: 'ApplePayCaptureSettings.SetupCard',
    ErrorCard: 'ApplePayCaptureSettings.ErrorCard',
    ReviewGroup: 'ApplePayCaptureSettings.ReviewGroup',
    ReviewCard: (captureId: string) => `ApplePayCaptureSettings.ReviewCard.${normalizePart(captureId)}` as const,
    ImportButton: (captureId: string) => `ApplePayCaptureSettings.ImportButton.${normalizePart(captureId)}` as const,
    DismissButton: (captureId: string) => `ApplePayCaptureSettings.DismissButton.${normalizePart(captureId)}` as const
} as const;
