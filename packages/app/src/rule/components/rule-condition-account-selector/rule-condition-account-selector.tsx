import { RuleCreateInputInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';
import { Controller, UseControllerReturn, useFormContext, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountSelectorBottomSheet } from '../../../account/component/account-selector-bottom-sheet/account-selector-bottom-sheet';
import { useGetAccountByIdQuery } from '../../../account/query/use-get-account-by-id.query';

interface Props {
    readonly index: number;
}

export const RuleConditionAccountSelector = ({ index }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const sheetRef = useRef<BottomSheetInterface | null>(null);

    const value = useWatch({ control, name: `conditions.${index}.value` });
    const accountId = isPositiveNumber(Number(value)) ? Number(value) : 0;
    const { account } = useGetAccountByIdQuery(accountId);
    const displayLabel = account?.title ?? t`Select account`;

    const handleOpenSheet = () => void sheetRef.current?.open();

    const renderSelector = ({
        field: { onChange }
    }: UseControllerReturn<RuleCreateInputInterface, `conditions.${number}.value`>) => {
        const handleSelect = (newAccountId: number) => {
            onChange(String(newAccountId));
        };

        return (
            <>
                <HapticPressable
                    onPress={handleOpenSheet}
                    className="bg-secondary-background rounded-xl px-lg py-md border border-secondary-corner"
                >
                    <Text className="text-primary text-sm">{displayLabel}</Text>
                </HapticPressable>

                <AccountSelectorBottomSheet
                    ref={sheetRef}
                    selectedAccount={account ?? null}
                    excludeAccountId={null}
                    onSelect={handleSelect}
                />
            </>
        );
    };

    return (
        <FormItem label={t`Value`}>
            <Controller control={control} name={`conditions.${index}.value`} render={renderSelector} />
        </FormItem>
    );
};
