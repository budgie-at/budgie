import { useCategorizeInboxGroupChoiceSelection } from '../../hook/use-categorize-inbox-group-choice-selection.hook';
import { CategorizeInboxLeadRow } from '../categorize-inbox-lead-row/categorize-inbox-lead-row';
import { CategorizeInboxSelectionIndicator } from '../categorize-inbox-selection-indicator/categorize-inbox-selection-indicator';

import type { CategorizeInboxGroupChoiceType } from '../../interface/categorize-inbox-group-choice.type';
import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly choice: CategorizeInboxGroupChoiceType;
    readonly variant: 'positive' | 'neutral';
    readonly title: string;
    readonly subtitle: string;
    readonly icon: UserIconType;
}

export const CategorizeInboxLeadOption = ({ choice, variant, title, subtitle, icon }: Props) => {
    const { isSelected, accessibilityState, onSelect } = useCategorizeInboxGroupChoiceSelection(choice);

    return (
        <CategorizeInboxLeadRow
            variant={variant}
            title={title}
            subtitle={subtitle}
            icon={icon}
            accessory={<CategorizeInboxSelectionIndicator isSelected={isSelected} />}
            accessibilityState={accessibilityState}
            onPress={onSelect}
        />
    );
};
