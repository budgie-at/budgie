import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
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
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const trade = getSecurityTrade(transaction);

    if (!isDefined(trade)) {
        return null;
    }

    const { securityEntry } = trade;
    const isPositionContext = accountId === securityEntry.accountId;
    const cashPrefix = isPositiveNumber(trade.cashFlow) ? '+' : '−';

    if (!isPositionContext) {
        return (
            <View className="shrink-0 items-end" testID={testID}>
                <MoneyText
                    amount={convertFromMicroUnits(Math.abs(trade.cashFlow))}
                    instrumentSymbol={trade.cashInstrument.symbol}
                    variant={MoneyTextVariantEnum.ROW}
                    prefix={cashPrefix}
                    tone="primary"
                />
            </View>
        );
    }

    const { instrument } = securityEntry.account;
    const quantityPrefix = trade.isBuy ? '+' : '−';
    const quantityLabel = formatInstrumentAmount(convertFromMicroUnits(trade.quantity), instrument.symbol, instrument.type);

    return (
        <View className="shrink-0 items-end" testID={testID}>
            <ProtectedText
                className="text-[17px] font-semibold tracking-tight text-primary tabular-nums"
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            >
                {`${quantityPrefix}${quantityLabel}`}
            </ProtectedText>
            {isDefined(securityEntry.baseAmount) ? (
                <MoneyText
                    amount={convertFromMicroUnits(securityEntry.baseAmount)}
                    instrumentSymbol={defaultInstrument.symbol}
                    variant={MoneyTextVariantEnum.CAPTION}
                />
            ) : null}
        </View>
    );
};
