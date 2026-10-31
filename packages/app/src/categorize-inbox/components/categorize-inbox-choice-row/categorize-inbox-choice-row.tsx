import { useCategorizeInboxGroupChoiceSelection } from '../../hook/use-categorize-inbox-group-choice-selection.hook';
import { CategorizeInboxOptionRow } from '../categorize-inbox-option-row/categorize-inbox-option-row';
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import type { CategorizeInboxTonalCapsuleVariantEnum } from '../../enum/categorize-inbox-tonal-capsule-variant.enum';
import type { CategorizeInboxGroupChoiceType } from '../../interface/categorize-inbox-group-choice.type';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly choice: CategorizeInboxGroupChoiceType;
    readonly icon: UserIconType;
    readonly title: string;
    readonly subtitle?: string;
    readonly tone?: CategorizeInboxTonalCapsuleVariantEnum;
}

export const CategorizeInboxChoiceRow = ({ choice, icon, title, subtitle, tone }: Props) => {
    const { isSelected, accessibilityState, onSelect } = useCategorizeInboxGroupChoiceSelection(choice);

    return (
        <CategorizeInboxOptionRow
            icon={icon}
            title={title}
            subtitle={subtitle}
            tone={tone}
            accessory={<CategorizeInboxSelectionIndicator variant="neutral" isSelected={isSelected} />}
            accessibilityState={accessibilityState}
            onPress={onSelect}
        />
    );
};
