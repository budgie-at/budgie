import type { OnboardingFileLockEnum } from '../enum/onboarding-file-lock.enum';

export interface OnboardingFileStateInterface {
    readonly state: string;
    readonly lock: OnboardingFileLockEnum;
}
