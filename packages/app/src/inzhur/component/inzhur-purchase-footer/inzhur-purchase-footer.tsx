import { useLingui } from '@lingui/react/macro';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { PillButtonFooter } from '../../../@generic/component/pill-button-footer/pill-button-footer';
import { useInzhurPurchaseSubmit } from '../../hook/use-inzhur-purchase-submit.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';
import type { InzhurPendingTopUpInterface } from '@budgie/sync';

interface Props {
    readonly topUp: InzhurPendingTopUpInterface;
}

export const InzhurPurchaseFooter = ({ topUp }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<InzhurPurchaseFormValues>();
    const { isValid } = useFormState({ control });
    const amount = useWatch({ control, name: 'amount' });
    const { isLoading, handleSave, handleSaveAndAddAnother } = useInzhurPurchaseSubmit(topUp.transactionId);

    const isSaveDisabled = !isValid;
    const isAddAnotherDisabled = isSaveDisabled || isLoading;
    const hasRemainingAfterSave = isPositiveNumber(topUp.remainingAmount - amount);

    return (
        <PillButtonFooter
            label={t`Save`}
            onPress={handleSave}
            isLoading={isLoading}
            isDisabled={isSaveDisabled}
            testID={InzhurSelector.PurchaseSaveButton}
        >
            {hasRemainingAfterSave ? (
                <Button
                    variant="ghost"
                    content={t`Save and add another`}
                    onPress={handleSaveAndAddAnother}
                    disabled={isAddAnotherDisabled}
                    testID={InzhurSelector.PurchaseSaveAndAddButton}
                />
            ) : null}
        </PillButtonFooter>
    );
};
