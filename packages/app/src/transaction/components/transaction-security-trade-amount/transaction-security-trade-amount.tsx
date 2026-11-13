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

    const { securityEntry } = trade;
    const positionValue = accountId === securityEntry.accountId ? securityEntry.baseAmount : null;
    const directionPrefix = trade.isBuy ? '+' : '−';
    const cashDirectionPrefix = isPositiveNumber(trade.cashFlow) ? '+' : '−';
    const cashPrefix = isDefined(accountId) ? cashDirectionPrefix : '';
    const isPositionValue = isDefined(positionValue);
    const amount = convertFromMicroUnits(Math.abs(positionValue ?? trade.cashFlow));
    const instrumentSymbol = isPositionValue ? defaultInstrument.symbol : trade.cashInstrument.symbol;
    const prefix = isPositionValue ? directionPrefix : cashPrefix;

    return (
        <View className="shrink-0 items-end" testID={testID}>
            <MoneyText
                amount={amount}
                instrumentSymbol={instrumentSymbol}
                variant={MoneyTextVariantEnum.ROW}
                prefix={prefix}
                tone="primary"
            />
        </View>
    );
};
