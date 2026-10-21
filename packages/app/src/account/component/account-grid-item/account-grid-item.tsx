import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { MANUAL_BALANCE_ACCOUNT_TYPES } from '../../constant/manual-balance-account-types.constant';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCardBaseSelector } from '../account-card-base/account-card-base.selector';
import { AccountCard } from '../account-card/account-card';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly hasLedgerHistory: boolean;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, balance, hasLedgerHistory, type, isLeft }: Props) => {
    const { t } = useLingui();

    const containerClassName = isLeft ? 'flex-1 pr-[5px]' : 'flex-1 pl-[5px]';
    const isAwaitingBalance = !hasLedgerHistory && MANUAL_BALANCE_ACCOUNT_TYPES.has(account.type);

    return (
        <View className={containerClassName}>
            {isAwaitingBalance ? (
                <AccountCardBase account={account} balance={balance} amountLabel={t`Add balance`}>
                    <Text
                        testID={AccountCardBaseSelector.AddBalance(account.title)}
                        className="text-md leading-[28px] font-medium text-secondary-foreground"
                    >
                        <Trans>Add balance</Trans>
                    </Text>
                </AccountCardBase>
            ) : (
                <AccountCard account={account} balance={balance} type={type} />
            )}
        </View>
    );
};
