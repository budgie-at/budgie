import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getSecurityTrade } from '../../utils/get-security-trade.util';

import type { TransactionAssociationEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: Pick<TransactionWithRelationsEntityInterface, TransactionAssociationEnum.ENTRIES | 'toAccountId' | 'type'>;
    readonly accountId: number | null;
    readonly testID: string;
}

export const TransactionSecurityTradeAmount = ({ transaction, accountId, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const trade = getSecurityTrade(transaction);

    if (!isDefined(trade)) {
        return null;
    }

    const positionAmount = accountId === trade.securityEntry.accountId ? trade.securityEntry.baseAmount : null;
    const positionPrefix = trade.isBuy ? '+' : '−';
    const cashPrefix = isPositiveNumber(trade.cashFlow) ? '+' : '−';
    const prefix = isDefined(positionAmount) ? positionPrefix : cashPrefix;
    const amount = positionAmount ?? Math.abs(trade.cashFlow);
    const instrumentSymbol = isDefined(positionAmount) ? defaultInstrument.symbol : trade.cashInstrument.symbol;

    return (
        <View className="shrink-0 items-end" testID={testID}>
            <MoneyText
                amount={convertFromMicroUnits(amount)}
                instrumentSymbol={instrumentSymbol}
                variant={MoneyTextVariantEnum.ROW}
                prefix={prefix}
                tone="primary"
            />
        </View>
    );
};
