import { AccountTypeEnum, AccountWithSyncEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ScaledIcon } from '../../../@generic/component/scaled-icon/scaled-icon';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { ACCOUNT_TYPE_SWATCH } from '../../constant/account-type-swatch.constant';
import { AccountRowLeadingContext } from '../../context/account-row-leading.context';
import { AccountListItem } from '../account-list-item/account-list-item';
import { AccountSectionHeader } from '../account-section-header/account-section-header';

import { CashCardSelector } from './cash-card.selector';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';

interface Props {
    readonly accounts: AccountWithSyncEntityInterface[];
    readonly total: number;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' as const };
const CASH_SWATCH = ACCOUNT_TYPE_SWATCH[AccountTypeEnum.CASH];

export const CashCard = ({ accounts, total, balancesByAccountId }: Props) => {
    if (!isNotEmptyArray(accounts)) {
        return null;
    }

    const handleRecordExpense = () =>
        void router.push({ pathname: '/create-transaction/expense', params: { accountId: String(accounts[0].id) } });

    const hasManyWallets = accounts.length > 1;
    const sectionTotal = hasManyWallets ? total : null;
    const cashTile = (
        <CircleIcon
            icon={UserIconNameEnum.Banknote}
            size={44}
            iconSize={22}
            radius={11}
            variant="ghost"
            border={false}
            className={CASH_SWATCH.soft}
            iconClassName={CASH_SWATCH.text}
        />
    );

    return (
        <View>
            <AccountSectionHeader type={AccountTypeEnum.CASH} total={sectionTotal} />

            <View className="overflow-hidden rounded-3xl bg-grouped-surface-row" style={CONTINUOUS_CORNERS} testID={CashCardSelector.Card}>
                {hasManyWallets ? (
                    accounts.map((account, index) => (
                        <View key={account.id}>
                            {index > 0 ? (
                                <View className="absolute top-0 right-0 left-[64px] h-hairline bg-surface-separator" pointerEvents="none" />
                            ) : null}
                            <AccountListItem account={account} type={AccountTypeEnum.CASH} balancesByAccountId={balancesByAccountId} />
                        </View>
                    ))
                ) : (
                    <AccountRowLeadingContext value={cashTile}>
                        <AccountListItem account={accounts[0]} type={AccountTypeEnum.CASH} balancesByAccountId={balancesByAccountId} />
                    </AccountRowLeadingContext>
                )}

                <HapticPressable
                    accessibilityRole="button"
                    onPress={handleRecordExpense}
                    className="min-h-[48px] flex-row items-center gap-x-sm pr-xl pl-3xl active:scale-100 active:bg-surface-fill"
                    testID={CashCardSelector.RecordExpense}
                >
                    <View className="absolute top-0 right-0 left-[16px] h-hairline bg-surface-separator" pointerEvents="none" />
                    <ScaledIcon icon={UserIconNameEnum.Plus} size={16} className={CASH_SWATCH.text} />
                    <Text maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER} className={cn('text-[15px] font-medium', CASH_SWATCH.text)}>
                        <Trans>Record expense</Trans>
                    </Text>
                </HapticPressable>
            </View>
        </View>
    );
};
