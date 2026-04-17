export const PinFormSelector = {
    Container: 'PinPage.Container',
    Title: 'PinPage.Title',
    Error: 'PinPage.Error',
    Digit: (digit: string) => `PinPage.Digit.${digit}` as const,
    DeleteButton: 'PinPage.DeleteButton',
    BiometricButton: 'PinPage.BiometricButton',
    BiometricSetupSwitch: 'PinPage.BiometricSetupSwitch',
    ContinueButton: 'PinPage.ContinueButton'
} as const;
