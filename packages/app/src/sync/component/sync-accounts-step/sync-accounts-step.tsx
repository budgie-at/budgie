import { UserIconNameEnum } from '@budgie/contracts';
import { SyncAccountTypeEnum } from '@budgie/sync';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SyncAccountRow } from '../sync-account-row/sync-account-row';

import { SyncAccountsStepSelector } from './sync-accounts-step.selector';

import type { AccountSelectionInterface } from '../../interface/account-selection.interface';
import type { ReactNode } from 'react';

interface Props extends Omit<AccountSelectionInterface, 'setPreviews'> {
    readonly logo: ReactNode;
    readonly footer?: string;
    readonly emptyDescription?: string;
}

export const SyncAccountsStep = ({
    accountPreviews,
    selectedAccounts,
    onToggle,
    onSelectAll,
    onDeselectAll,
    logo,
    footer,
    emptyDescription
}: Props) => {
    const { t } = useLingui();
    const accountRows = accountPreviews.filter(preview => preview.type !== SyncAccountTypeEnum.JAR);
    const jarRows = accountPreviews.filter(preview => preview.type === SyncAccountTypeEnum.JAR);
    const accountsCount = accountRows.length;
    const description = emptyDescription ?? t`This connection returned no accounts Budgie can add.`;
    const sectionFooter = footer ?? t`Choose what to track. Balances and history come straight from the bank.`;
    const areAllSelected = selectedAccounts.size === accountPreviews.length;
    const toggleAllLabel = areAllSelected ? t`Deselect all` : t`Select all`;
    const handleToggleAll = areAllSelected ? onDeselectAll : onSelectAll;

    if (isEmptyArray(accountPreviews)) {
        return <SearchablePageEmptyState icon={UserIconNameEnum.Landmark} title={t`No accounts to connect`} description={description} />;
    }

    return (
        <>
            <View>
                <View className="flex-row items-end justify-between">
                    <GroupedListSectionTitle title={t`Accounts · ${accountsCount}`} />
                    <HapticPressable
                        onPress={handleToggleAll}
                        accessibilityRole="button"
                        className="-mt-[16px] min-h-[44px] justify-end px-3xl pb-md active:opacity-70"
                        testID={SyncAccountsStepSelector.ToggleAll}
                    >
                        <Text className="text-primary text-[15px] font-semibold">{toggleAllLabel}</Text>
                    </HapticPressable>
                </View>
                <GroupedListSection footer={sectionFooter}>
                    {accountRows.map(preview => (
                        <SyncAccountRow
                            key={preview.externalId}
                            preview={preview}
                            logo={logo}
                            isSelected={selectedAccounts.has(preview.externalId)}
                            onToggle={onToggle}
                        />
                    ))}
                </GroupedListSection>
            </View>

            {isNotEmptyArray(jarRows) ? (
                <GroupedListSection title={t`Jars`}>
                    {jarRows.map(preview => (
                        <SyncAccountRow
                            key={preview.externalId}
                            preview={preview}
                            logo={logo}
                            isSelected={selectedAccounts.has(preview.externalId)}
                            onToggle={onToggle}
                        />
                    ))}
                </GroupedListSection>
            ) : null}
        </>
    );
};
