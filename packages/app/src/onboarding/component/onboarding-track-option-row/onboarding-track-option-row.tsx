import { AccountTypeEnum } from '@budgie/contracts';

import { OnboardingTrackOptionInterface } from '../../interface/onboarding-track-option.interface';
import { OnboardingOptionRow } from '../onboarding-option-row/onboarding-option-row';

import { OnboardingTrackOptionRowSelector } from './onboarding-track-option-row.selector';

interface Props {
    readonly option: OnboardingTrackOptionInterface;
    readonly isSelected: boolean;
    readonly onToggle: (type: AccountTypeEnum) => void;
}

export const OnboardingTrackOptionRow = ({ option, isSelected, onToggle }: Props) => {
    const handlePress = () => void onToggle(option.type);

    return (
        <OnboardingOptionRow
            icon={option.icon}
            title={option.title}
            isSelected={isSelected}
            onPress={handlePress}
            testID={OnboardingTrackOptionRowSelector.Root(option.type)}
        />
    );
};
