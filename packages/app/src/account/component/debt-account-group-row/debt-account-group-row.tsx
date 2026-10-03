import { AccountWithSyncEntityInterface, DebtAccountProgressSummaryInterface } from '@budgie/contracts';
import { StyleSheet, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { DebtAccountCard } from '../debt-account-card/debt-account-card';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly debtProgressSummary: DebtAccountProgressSummaryInterface | null;
    readonly index: number;
}

export const DebtAccountGroupRow = ({ account, debtProgressSummary, index }: Props) => {
    const dividerStyle = { height: StyleSheet.hairlineWidth };

    return (
        <View>
            {isPositiveNumber(index) ? <View className="ml-[70px] mr-3xl bg-secondary-corner" style={dividerStyle} /> : null}
            <DebtAccountCard account={account} instrumentSymbol={account.instrument.symbol} debtProgressSummary={debtProgressSummary} />
        </View>
    );
};
