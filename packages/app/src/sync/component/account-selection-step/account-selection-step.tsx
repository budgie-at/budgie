import { BankAccountTypeEnum } from '@budgie/bank-sync';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { EmptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SyncAccountPreviewInterface } from '../../interface/sync-account-preview.interface';
import { BankAccountPreviewList } from '../bank-account-preview-list/bank-account-preview-list';

import { AccountSelectionStepSelector } from './account-selection-step.selector';

interface Props {
    readonly accountPreviews: SyncAccountPreviewInterface[];
    readonly selectedAccounts: Set<string>;
    readonly onToggle: (externalId: string) => void;
    readonly onSelectAll: EmptyFn;
    readonly onDeselectAll: EmptyFn;
}

export const AccountSelectionStep = ({ accountPreviews, selectedAccounts, onToggle, onSelectAll, onDeselectAll }: Props) => {
    const cardPreviews = accountPreviews.filter(preview => preview.type !== BankAccountTypeEnum.JAR);
    const jarPreviews = accountPreviews.filter(preview => preview.type === BankAccountTypeEnum.JAR);
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

            <BankAccountPreviewList previews={cardPreviews} selectedAccounts={selectedAccounts} onToggle={onToggle} />

            {isNotEmptyArray(jarPreviews) && (
                <>
                    <View className="px-md pt-md">
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>Jars</Trans>
                        </Text>
                    </View>

                    <BankAccountPreviewList previews={jarPreviews} selectedAccounts={selectedAccounts} onToggle={onToggle} />
                </>
            )}
        </>
    );
};
