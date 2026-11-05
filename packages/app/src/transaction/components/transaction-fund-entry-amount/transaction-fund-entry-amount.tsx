import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { transactionAmountVariants } from '../../constant/transaction-amount-variants.constant';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly entry: AggregatedTransactionEntryInterface;
    readonly variant: ColorPaletteVariant;
    readonly sign: string;
    readonly testID: string;
}

export const TransactionFundEntryAmount = ({ entry, variant, sign, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatFundQuantity = useFormatFundQuantity();

    const quantityLabel = `${sign}${formatFundQuantity(convertFromMicroUnits(entry.amount))}`;

    if (!isDefined(entry.baseAmount)) {
        return (
            <View className="shrink-0 items-end" testID={testID}>
                <Text className={transactionAmountVariants({ variant })}>{quantityLabel}</Text>
            </View>
        );
    }

    return (
        <View className="shrink-0 items-end gap-y-xxs" testID={testID}>
            <MoneyText
                amount={convertFromMicroUnits(entry.baseAmount)}
                instrumentSymbol={defaultInstrument.symbol}
                variant={MoneyTextVariantEnum.BODY}
                prefix={sign}
                tone={variant}
            />
            <Text className="text-[13px] text-secondary-foreground text-right tabular-nums">{quantityLabel}</Text>
        </View>
    );
};
