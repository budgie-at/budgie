import { TransactionEntryTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { isSecurityInstrumentType } from '../../../instrument/utils/is-security-instrument-type.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { sumEntryAmounts } from '../../utils/sum-entry-amounts.util';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';
import type { TransactionAssociationEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: Pick<TransactionWithRelationsEntityInterface, TransactionAssociationEnum.ENTRIES>;
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly accountId: number | null;
    readonly testID: string;
}

export const TransactionSecurityTradeAmount = ({ transaction, fromEntry, toEntry, accountId, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const isBuy = isSecurityInstrumentType(toEntry.account.instrument.type);
    const [securityEntry, moneyEntry] = isBuy ? [toEntry, fromEntry] : [fromEntry, toEntry];
    const fee = sumEntryAmounts(transaction.entries.filter(entry => entry.type === TransactionEntryTypeEnum.FEE));
    const positionAmount = accountId === securityEntry.account.id ? securityEntry.baseAmount : null;
    const isBrokerageView = !isDefined(accountId);
    const positionPrefix = isBuy ? '+' : '−';
    const netAmount = isBrokerageView ? fee : moneyEntry.amount;
    const netPrefix = isBrokerageView && isPositiveNumber(fee) ? '−' : '';
    const isZeroFeeTrade = isBrokerageView && !isPositiveNumber(fee);
    const prefix = isDefined(positionAmount) ? positionPrefix : netPrefix;
    const instrumentSymbol = isDefined(positionAmount) ? defaultInstrument.symbol : moneyEntry.account.instrument.symbol;

    return (
        <View className="shrink-0 items-end" testID={testID}>
            {isZeroFeeTrade ? null : (
                <MoneyText
                    amount={convertFromMicroUnits(positionAmount ?? netAmount)}
                    instrumentSymbol={instrumentSymbol}
                    variant={MoneyTextVariantEnum.ROW}
                    prefix={prefix}
                    tone="primary"
                />
            )}
        </View>
    );
};
