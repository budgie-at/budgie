import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined } from '@rnw-community/shared';

import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { BudgetSelector } from '../../budget.selector';
import { BudgetEventFormValues } from '../../constant/budget-event-form-schema.constant';
import { resolveBudgetEventSaveBlocker } from '../../utils/resolve-budget-event-save-blocker.util';

interface Props {
    readonly submitLabel: string;
    readonly isSaving: boolean;
    readonly onPress: () => void;
}

export const BudgetEventSaveFooter = ({ submitLabel, isSaving, onPress }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetEventFormValues>();
    const [name, tagId, startsAtMs, endsAtMs, overallLimit, categoryLimits, instrumentId] = useWatch({
        control,
        name: ['name', 'tagId', 'startsAtMs', 'endsAtMs', 'overallLimit', 'categoryLimits', 'instrumentId']
    });
    const saveBlocker = resolveBudgetEventSaveBlocker({ name, tagId, startsAtMs, endsAtMs, overallLimit, categoryLimits, instrumentId });
    const label = isDefined(saveBlocker) ? t(saveBlocker) : submitLabel;

    return (
        <PillButtonFooter
            label={label}
            isDisabled={isDefined(saveBlocker)}
            isLoading={isSaving}
            testID={BudgetSelector.EventSaveButton}
            onPress={onPress}
        />
    );
};
