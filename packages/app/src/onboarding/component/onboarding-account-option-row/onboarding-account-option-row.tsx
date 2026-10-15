import { AccountTypeEnum } from '@budgie/contracts';

import { OnboardingOptionRow } from '../onboarding-option-row/onboarding-option-row';

import type { OnboardingAccountOptionInterface } from '../../interface/onboarding-account-option.interface';

interface Props {
    readonly option: OnboardingAccountOptionInterface;
    readonly isSelected: boolean;
    readonly onToggle: (type: AccountTypeEnum) => void;
    readonly testID: string;
}

export const OnboardingAccountOptionRow = ({ option, isSelected, onToggle, testID }: Props) => {
    const handlePress = () => void onToggle(option.type);

    return <OnboardingOptionRow testID={testID} icon={option.icon} title={option.title} isSelected={isSelected} onPress={handlePress} />;
};
