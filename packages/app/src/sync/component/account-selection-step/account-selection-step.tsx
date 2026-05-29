import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { BankAccountPreviewInterface } from '../../interface/bank-account-preview.interface';
import { BankAccountPreviewCard } from '../bank-account-preview-card/bank-account-preview-card';

import { AccountSelectionStepSelector } from './account-selection-step.selector';

interface Props {
    readonly accountPreviews: BankAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly onToggle: (externalId: string) => void;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
}

export const AccountSelectionStep = ({ accountPreviews, selectedAccounts, onToggle, onSelectAll, onDeselectAll }: Props) => {
    const areAllSelected = isNotEmptyArray(accountPreviews) && selectedAccounts.size === accountPreviews.length;
    const handleToggleAll = areAllSelected ? onDeselectAll : onSelectAll;
    const toggleAllLabel = areAllSelected ? <Trans>Deselect all</Trans> : <Trans>Select all</Trans>;

    return (
        <>
            <View className="flex-row items-center justify-between px-md">
                <Text className="text-secondary-foreground text-sm">
                    <Trans>Select accounts to sync:</Trans>
                </Text>

                <HapticPressable onPress={handleToggleAll} testID={AccountSelectionStepSelector.ToggleAll}>
                    <Text className="text-primary font-semibold text-sm">{toggleAllLabel}</Text>
                </HapticPressable>
            </View>

            {accountPreviews.map(preview => (
                <BankAccountPreviewCard
                    key={preview.externalId}
                    preview={preview}
                    isSelected={selectedAccounts.has(preview.externalId)}
                    onToggle={onToggle}
                />
            ))}
        </>
    );
};
