import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useBudgetEventTagPreview } from '../../hooks/use-budget-event-tag-preview.hook';

export const BudgetEventTagNote = () => {
    const { title, isNew } = useBudgetEventTagPreview();

    if (isNew) {
        return (
            <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
                <Trans>Saving creates the tag “{title}”. Tagged expenses in these dates count here and in your main budget.</Trans>
            </Text>
        );
    }

    if (isNotEmptyString(title)) {
        return (
            <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
                <Trans>Expenses tagged “{title}” in these dates count here and in your main budget.</Trans>
            </Text>
        );
    }

    return (
        <Text className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]">
            <Trans>Name the event to set up its tag. Tagged expenses count here and in your main budget.</Trans>
        </Text>
    );
};
