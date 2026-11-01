import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { MANUAL_BALANCE_ACCOUNT_TYPES } from '../../constant/manual-balance-account-types.constant';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';
import { AccountCard } from '../account-card/account-card';

import type { HomeAccountBalanceInterface } from '../../interface/home-account-balance.interface';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly type: AccountTypeEnum;
    readonly balancesByAccountId: ReadonlyMap<number, HomeAccountBalanceInterface>;
}

export const AccountListItem = ({ account, type, balancesByAccountId }: Props) => {
    const { t } = useLingui();

    const accountBalance = balancesByAccountId.get(account.id);
    const balance = accountBalance?.balance ?? 0;
    const convertedBalance = accountBalance?.convertedBalance ?? null;
    const isAwaitingBalance = !(accountBalance?.hasLedgerHistory ?? true) && MANUAL_BALANCE_ACCOUNT_TYPES.has(account.type);

    if (isAwaitingBalance) {
        return (
            <AccountCardBase account={account} balance={balance} convertedBalance={null} amountLabel={t`Add balance`}>
                <Text
                    testID={AccountCardBaseSelector.AddBalance(account.title)}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    className="text-[15px] font-medium text-secondary-foreground"
                >
                    <Trans>Add balance</Trans>
                </Text>
            </AccountCardBase>
        );
    }

    return <AccountCard account={account} balance={balance} convertedBalance={convertedBalance} type={type} />;
};
