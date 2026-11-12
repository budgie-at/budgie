import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { isSecurityInstrumentType } from '../../../instrument/utils/is-security-instrument-type.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly fromEntry: AggregatedTransactionEntryInterface;
    readonly toEntry: AggregatedTransactionEntryInterface;
    readonly accountId: number | null;
    readonly testID: string;
}

export const TransactionSecurityTradeAmount = ({ fromEntry, toEntry, accountId, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const isBuy = isSecurityInstrumentType(toEntry.account.instrument.type);
    const [securityEntry, moneyEntry] = isBuy ? [toEntry, fromEntry] : [fromEntry, toEntry];
    const positionAmount = accountId === securityEntry.account.id ? securityEntry.baseAmount : null;
    const positionSign = isBuy ? '+' : '−';
    const prefix = isDefined(positionAmount) ? positionSign : '';
    const instrumentSymbol = isDefined(positionAmount) ? defaultInstrument.symbol : moneyEntry.account.instrument.symbol;

    return (
        <View className="shrink-0 items-end" testID={testID}>
            <MoneyText
                amount={convertFromMicroUnits(positionAmount ?? moneyEntry.amount)}
                instrumentSymbol={instrumentSymbol}
                variant={MoneyTextVariantEnum.ROW}
                prefix={prefix}
                tone="primary"
            />
        </View>
    );
};
