import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { EnableBankingAccountRow } from '../enable-banking-account-row/enable-banking-account-row';
import { EnableBankingParkedAccountRow } from '../enable-banking-parked-account-row/enable-banking-parked-account-row';

import type { AccountSelectionInterface } from '../../interface/account-selection.interface';
import type { SyncAccountPreviewInterface } from '@budgie/sync';

interface Props extends Omit<AccountSelectionInterface, 'setPreviews'> {
    readonly parkedPreviews: readonly SyncAccountPreviewInterface[];
}

export const EnableBankingAccountsStep = ({
    accountPreviews,
    selectedAccounts,
    onToggle,
    onSelectAll,
    onDeselectAll,
    parkedPreviews
}: Props) => {
    const { t } = useLingui();
    const missingAccount = t`Missing an account? Link it to your application in Enable Banking, then connect this bank again.`;
    const accountsCount = accountPreviews.length;
    const areAllSelected = isNotEmptyArray(accountPreviews) && selectedAccounts.size === accountsCount;
    const toggleAllLabel = areAllSelected ? t`Deselect all` : t`Select all`;
    const handleToggleAll = areAllSelected ? onDeselectAll : onSelectAll;

    return (
        <>
            {isEmptyArray(accountPreviews) ? (
                <SearchablePageEmptyState icon={UserIconNameEnum.Landmark} title={t`No accounts to connect`} description={missingAccount} />
            ) : (
                <View>
                    <View className="flex-row items-end justify-between">
                        <GroupedListSectionTitle title={t`Accounts · ${accountsCount}`} />
                        {accountsCount > 1 ? (
                            <HapticPressable
                                onPress={handleToggleAll}
                                accessibilityRole="button"
                                className="min-h-[44px] justify-end px-3xl pb-md active:opacity-70"
                            >
                                <Text className="text-primary text-[15px] font-semibold">{toggleAllLabel}</Text>
                            </HapticPressable>
                        ) : null}
                    </View>
                    <GroupedListSection footer={t`Balances and history come from your bank through Enable Banking.`}>
                        {accountPreviews.map(preview => (
                            <EnableBankingAccountRow
                                key={preview.externalId}
                                preview={preview}
                                isSelected={selectedAccounts.has(preview.externalId)}
                                onToggle={onToggle}
                            />
                        ))}
                    </GroupedListSection>
                </View>
            )}

            {isNotEmptyArray(parkedPreviews) ? (
                <GroupedListSection
                    title={t`Cannot connect`}
                    footer={t`These accounts already exist in Budgie or use a currency Budgie does not support. To continue an existing account, open it and tap Connect to bank.`}
                >
                    {parkedPreviews.map(preview => (
                        <EnableBankingParkedAccountRow key={preview.externalId} preview={preview} />
                    ))}
                </GroupedListSection>
            ) : null}

            {isNotEmptyArray(accountPreviews) ? (
                <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">{missingAccount}</Text>
            ) : null}
        </>
    );
};
