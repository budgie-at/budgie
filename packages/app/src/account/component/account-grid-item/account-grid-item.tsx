import { AccountTypeEnum, AccountWithSyncEntityInterface, convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { AccountCardBase } from '../account-card-base/account-card-base';
import { AccountCard } from '../account-card/account-card';

const ADD_BALANCE_ACCOUNT_TYPES: ReadonlySet<AccountTypeEnum> = new Set([
    AccountTypeEnum.CASH,
    AccountTypeEnum.BANK,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.DEPOSIT,
    AccountTypeEnum.STOCKS
]);

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly hasLedgerHistory: boolean;
    readonly type: AccountTypeEnum;
    readonly isLeft: boolean;
}

export const AccountGridItem = ({ account, balance, hasLedgerHistory, type, isLeft }: Props) => {
    const { id, title, icon, externalId, instrument, targetBalance, sync } = account;

    const containerClassName = isLeft ? 'flex-1 pr-1.5' : 'flex-1 pl-1.5';
    const cardTargetBalance = convertFromMicroUnits(targetBalance);
    const isAwaitingBalance = !hasLedgerHistory && ADD_BALANCE_ACCOUNT_TYPES.has(account.type);
    const addBalanceContent = (
        <Text className="text-secondary-foreground font-medium">
            <Trans>Add balance</Trans>
        </Text>
    );

    return (
        <View className={containerClassName}>
            {isAwaitingBalance ? (
                <AccountCardBase
                    id={id}
                    title={title}
                    icon={icon}
                    balance={balance}
                    instrumentSymbol={instrument.symbol}
                    balanceContent={addBalanceContent}
                />
            ) : (
                <AccountCard
                    targetBalance={cardTargetBalance}
                    type={type}
                    id={id}
                    balance={balance}
                    icon={icon}
                    externalId={externalId}
                    title={title}
                    sync={sync}
                    instrumentId={instrument.id}
                    instrumentCode={instrument.code}
                    instrumentSymbol={instrument.symbol}
                />
            )}
        </View>
    );
};
