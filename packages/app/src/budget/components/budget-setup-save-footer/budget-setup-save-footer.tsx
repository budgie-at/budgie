import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { BudgetSelector } from '../../budget.selector';
import { BudgetFormValues } from '../../constant/budget-form-schema.constant';
import { resolveBudgetSaveBlocker } from '../../utils/resolve-budget-save-blocker.util';

interface Props {
    readonly defaultInstrumentId: number;
    readonly submitLabel: string;
    readonly isFormLoading: boolean;
    readonly isSubmitting: boolean;
    readonly onPress: () => void;
}

export const BudgetSetupSaveFooter = ({ defaultInstrumentId, submitLabel, isFormLoading, isSubmitting, onPress }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<BudgetFormValues>();
    const watchedSaveBlocker = useWatch({
        control,
        compute: values => {
            const resolvedInstrumentId = isPositiveNumber(values.instrumentId) ? values.instrumentId : defaultInstrumentId;

            return resolveBudgetSaveBlocker({ ...values, instrumentId: resolvedInstrumentId });
        }
    });
    const saveBlocker = isFormLoading ? null : watchedSaveBlocker;
    const isSaveDisabled = isFormLoading || isDefined(saveBlocker);
    const saveLabel = isDefined(saveBlocker) ? t(saveBlocker) : submitLabel;

    return (
        <PillButtonFooter
            label={saveLabel}
            accessibilityLabel={submitLabel}
            isLoading={isSubmitting}
            isDisabled={isSaveDisabled}
            testID={BudgetSelector.SetupSaveButton}
            onPress={onPress}
        />
    );
};
