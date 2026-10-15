export interface OnboardingPinContextInterface {
    readonly pin: string | null;
    readonly setPin: (pin: string | null) => void;
}
