export const PinFormSelector = {
    Container: 'PinPage.Container',
    Title: 'PinPage.Title',
    Error: 'PinPage.Error',
    Digit: (digit: string) => `PinPage.Digit.${digit}` as const,
    DeleteButton: 'PinPage.DeleteButton',
    BiometricButton: 'PinPage.BiometricButton',
    ContinueButton: 'PinPage.ContinueButton',
    SkipBiometricButton: 'PinPage.SkipBiometricButton',
    RestartNewPinButton: 'PinPage.RestartNewPinButton',
    StepIndicator: 'PinPage.StepIndicator',
    SealingState: 'PinPage.SealingState'
} as const;
