import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly entry: AggregatedTransactionEntryInterface;
    readonly testID: string;
}

export const TransactionFundEntryAmount = ({ entry, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    return (
        <View className="shrink-0 items-end" testID={testID}>
            {isDefined(entry.baseAmount) ? (
                <MoneyText
                    amount={convertFromMicroUnits(entry.baseAmount)}
                    instrumentSymbol={defaultInstrument.symbol}
                    variant={MoneyTextVariantEnum.ROW}
                    tone="primary"
                />
            ) : null}
        </View>
    );
};
