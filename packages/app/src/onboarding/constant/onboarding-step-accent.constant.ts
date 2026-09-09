import { ColorPaletteVariant } from '../../@generic/type/color-palette-variant.type';
import { OnboardingStepEnum } from '../enum/onboarding-step.enum';

export const ONBOARDING_STEP_ACCENT: Record<OnboardingStepEnum, ColorPaletteVariant> = {
    [OnboardingStepEnum.WELCOME]: 'primary',
    [OnboardingStepEnum.TRACK]: 'cyan',
    [OnboardingStepEnum.BALANCES]: 'violet',
    [OnboardingStepEnum.EXPENSE]: 'destructive',
    [OnboardingStepEnum.BUDGET]: 'positive',
    [OnboardingStepEnum.LOCK]: 'warning',
    [OnboardingStepEnum.AI]: 'pink',
    [OnboardingStepEnum.DONE]: 'positive'
};
