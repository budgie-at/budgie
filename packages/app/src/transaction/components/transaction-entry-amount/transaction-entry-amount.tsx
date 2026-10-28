import { DebtEventAssociationEnum, InstrumentTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ConvertedAmountLabel } from '../converted-amount-label/converted-amount-label';
import { DebtSettlementConvertedAmountLabel } from '../debt-settlement-converted-amount-label/debt-settlement-converted-amount-label';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';
import type { DebtEventWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly debtEvent?: DebtEventWithRelationsEntityInterface | null;
    readonly entry: AggregatedTransactionEntryInterface;
    readonly variant: ColorPaletteVariant;
    readonly testID: string;
}

const amountVariants = cva('text-sm font-semibold text-right', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const TransactionEntryAmount = ({ debtEvent, entry, variant, testID }: Props) => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const formatDigits = useDisplayFormatDigits();

    const amount = convertFromMicroUnits(entry.amount);
    const formattedAmount = formatDigits(amount, entry.account.instrument.symbol);
    const isCrossCurrency = entry.account.instrument.id !== defaultInstrumentId;
    const shouldShowExchangeRate = entry.account.instrument.type === InstrumentTypeEnum.CRYPTO;
    const debtConversionEvent =
        isDefined(debtEvent) && debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument.id !== entry.account.instrument.id
            ? debtEvent
            : null;
    const debtConversionAccessibilityLabel = isDefined(debtConversionEvent)
        ? `${formattedAmount} → ${formatDigits(
              convertFromMicroUnits(debtConversionEvent.amount),
              debtConversionEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument.symbol
          )}`
        : null;
    const convertedAmountLabel = isCrossCurrency ? (
        <ConvertedAmountLabel
            instrumentId={entry.account.instrument.id}
            instrumentSymbol={entry.account.instrument.symbol}
            amount={entry.amount}
            baseAmount={entry.baseAmount}
            shouldShowExchangeRate={shouldShowExchangeRate}
        />
    ) : null;
    const secondaryAmountLabel = isDefined(debtConversionEvent) ? (
        <DebtSettlementConvertedAmountLabel debtEvent={debtConversionEvent} />
    ) : (
        convertedAmountLabel
    );

    return (
        <View
            className="items-end"
            testID={testID}
            {...(isDefined(debtConversionAccessibilityLabel) && {
                accessibilityLabel: debtConversionAccessibilityLabel,
                accessible: true
            })}
        >
            <Text className={amountVariants({ variant })}>{formattedAmount}</Text>
            {secondaryAmountLabel}
        </View>
    );
};
