import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { PillButton } from '../../../@generic/component/pill-button/pill-button';
import { useInzhurPurchaseSubmit } from '../../hook/use-inzhur-purchase-submit.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';

import type { InzhurPurchaseFormValues } from '../../constant/inzhur-purchase-form-schema.constant';
import type { InzhurPendingTopUpInterface } from '@budgie/sync';

interface Props {
    readonly topUp: InzhurPendingTopUpInterface;
}

export const InzhurPurchaseFooter = ({ topUp }: Props) => {
    const { t } = useLingui();
    const { control, formState } = useFormContext<InzhurPurchaseFormValues>();
    const amount = useWatch({ control, name: 'amount' });
    const { isLoading, handleSave, handleSaveAndAddAnother } = useInzhurPurchaseSubmit(topUp.transactionId);

    const isSaveDisabled = !formState.isValid;
    const isAddAnotherDisabled = isSaveDisabled || isLoading;
    const hasRemainingAfterSave = isPositiveNumber(topUp.remainingAmount - amount);

    return (
        <View className="gap-y-md bg-surface px-5xl pt-lg">
            <View className="absolute inset-x-0 top-full h-[64px] bg-surface" pointerEvents="none" />
            <PillButton
                label={t`Save`}
                onPress={handleSave}
                isLoading={isLoading}
                isDisabled={isSaveDisabled}
                testID={InzhurSelector.PurchaseSaveButton}
            />
            {hasRemainingAfterSave ? (
                <Button
                    variant="ghost"
                    content={t`Save and add another`}
                    onPress={handleSaveAndAddAnother}
                    disabled={isAddAnotherDisabled}
                    testID={InzhurSelector.PurchaseSaveAndAddButton}
                />
            ) : null}
        </View>
    );
};
