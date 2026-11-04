import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
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
    const areAllSelected = isNotEmptyArray(accountPreviews) && selectedAccounts.size === accountPreviews.length;
    const toggleAllLabel = areAllSelected ? t`Deselect all` : t`Select all`;
    const handleToggleAll = areAllSelected ? onDeselectAll : onSelectAll;

    return (
        <>
            {isEmptyArray(accountPreviews) ? (
                <View className="gap-y-sm px-3xl py-xl">
                    <Text className="text-primary text-center text-[17px] font-semibold">{t`No accounts to connect`}</Text>
                    <Text className="text-secondary-foreground text-center text-[15px] leading-[20px]">{missingAccount}</Text>
                </View>
            ) : (
                <GroupedListSection footer={t`Balances and history come from your bank through Enable Banking.`}>
                    {accountPreviews.map(preview => (
                        <EnableBankingAccountRow
                            key={preview.externalId}
                            preview={preview}
                            isSelected={selectedAccounts.has(preview.externalId)}
                            onToggle={onToggle}
                        />
                    ))}
                    {accountPreviews.length > 1 ? (
                        <GroupedListRow
                            left={<GroupedListIcon icon={UserIconNameEnum.CheckCheck} />}
                            title={toggleAllLabel}
                            right={<></>}
                            onPress={handleToggleAll}
                        />
                    ) : null}
                </GroupedListSection>
            )}

            {isNotEmptyArray(parkedPreviews) ? (
                <GroupedListSection
                    title={t`Cannot connect`}
                    footer={t`These accounts already sync through another connection or use a currency Budgie does not support.`}
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
