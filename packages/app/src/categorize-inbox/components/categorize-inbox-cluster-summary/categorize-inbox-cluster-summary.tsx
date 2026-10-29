import { TransactionTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { CategorizeInboxAmount } from '../categorize-inbox-amount/categorize-inbox-amount';
import { CategorizeInboxClusterIcon } from '../categorize-inbox-cluster-icon/categorize-inbox-cluster-icon';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly children: ReactNode;
}

export const CategorizeInboxClusterSummary = ({ cluster, children }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const { displayTitle, rows, totalBaseAmount } = cluster;
    const [firstRow] = rows;
    const isIncome = firstRow.type === TransactionTypeEnum.INCOME;
    const isSingleRow = rows.length === 1;
    const amount = isSingleRow ? firstRow.amount : totalBaseAmount;
    const symbol = isSingleRow ? firstRow.instrumentSymbol : defaultInstrument.symbol;
    const amountNode = isDefined(amount) ? <CategorizeInboxAmount amount={amount} symbol={symbol} isIncome={isIncome} /> : null;

    return (
        <View className="flex-row items-start gap-x-xl">
            <CategorizeInboxClusterIcon cluster={cluster} />

            <View className="flex-1 gap-y-xs">
                <Text className="text-primary text-sm font-semibold" numberOfLines={2}>
                    {displayTitle}
                </Text>
                {children}
            </View>

            {amountNode}
        </View>
    );
};
