import { DebtEventAssociationEnum, InstrumentTypeEnum, convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';
import { isSecurityInstrumentType } from '../../../instrument/utils/is-security-instrument-type.util';
import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { ConvertedAmountLabel } from '../converted-amount-label/converted-amount-label';
import { DebtSettlementConvertedAmountLabel } from '../debt-settlement-converted-amount-label/debt-settlement-converted-amount-label';
import { TransactionFundEntryAmount } from '../transaction-fund-entry-amount/transaction-fund-entry-amount';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';
import type { DebtEventWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly debtEvent?: DebtEventWithRelationsEntityInterface | null;
    readonly entry: AggregatedTransactionEntryInterface;
    readonly variant: ColorPaletteVariant;
    readonly sign: string;
    readonly testID: string;
}

const transactionAmountVariants = cva('text-[17px] font-semibold tracking-tight text-right tabular-nums', {
    variants: { variant: { ...FOREGROUND_COLOR_PALETTE, positive: 'text-positive-strong' } }
});

export const TransactionEntryAmount = ({ debtEvent, entry, variant, sign, testID }: Props) => {
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const formatDigits = useFormatInstrumentAmount();

    if (isSecurityInstrumentType(entry.account.instrument.type)) {
        return <TransactionFundEntryAmount entry={entry} testID={testID} />;
    }

    const amount = convertFromMicroUnits(entry.amount);
    const formattedAmount = formatDigits(amount, entry.account.instrument.symbol, entry.account.instrument.type);
    const isCrossCurrency = entry.account.instrument.id !== defaultInstrumentId;
    const debtConversionEvent =
        isDefined(debtEvent) && debtEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument.id !== entry.account.instrument.id
            ? debtEvent
            : null;
    const debtConversionAccessibilityLabel = isDefined(debtConversionEvent)
        ? `${sign}${formattedAmount} → ${formatDigits(
              convertFromMicroUnits(debtConversionEvent.amount),
              debtConversionEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument.symbol,
              debtConversionEvent[DebtEventAssociationEnum.DEBT_ACCOUNT].instrument.type
          )}`
        : null;
    const convertedAmountLabel = isCrossCurrency ? (
        <ConvertedAmountLabel instrumentId={entry.account.instrument.id} amount={entry.amount} baseAmount={entry.baseAmount} />
    ) : null;
    const secondaryAmountLabel = isDefined(debtConversionEvent) ? (
        <DebtSettlementConvertedAmountLabel debtEvent={debtConversionEvent} />
    ) : (
        convertedAmountLabel
    );

    return (
        <View
            className="shrink-0 items-end gap-y-xxs"
            testID={testID}
            {...(isDefined(debtConversionAccessibilityLabel) && {
                accessibilityLabel: debtConversionAccessibilityLabel,
                accessible: true
            })}
        >
            {entry.account.instrument.type === InstrumentTypeEnum.FIAT ? (
                <MoneyText
                    amount={amount}
                    instrumentSymbol={entry.account.instrument.symbol}
                    variant={MoneyTextVariantEnum.ROW}
                    prefix={sign}
                    tone={variant}
                />
            ) : (
                <Text className={transactionAmountVariants({ variant })}>{`${sign}${formattedAmount}`}</Text>
            )}
            {secondaryAmountLabel}
        </View>
    );
};
