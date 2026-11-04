import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatFundQuantity } from '../../../i18n/hook/use-format-fund-quantity.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { AggregatedTransactionEntryInterface } from '../../interface/aggregated-transaction-entry.interface';

interface Props {
    readonly entry: AggregatedTransactionEntryInterface;
    readonly variant: ColorPaletteVariant;
    readonly sign: string;
    readonly testID: string;
}

const amountVariants = cva('text-[15px] font-semibold text-right tabular-nums', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const TransactionFundEntryAmount = ({ entry, variant, sign, testID }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
    const formatFundQuantity = useFormatFundQuantity();

    const quantityLabel = `${sign}${formatFundQuantity(convertFromMicroUnits(entry.amount))}`;
    const valueLabel = isDefined(entry.baseAmount)
        ? `${sign}${formatDigits(convertFromMicroUnits(entry.baseAmount), defaultInstrument.symbol)}`
        : null;

    return (
        <View className="shrink-0 items-end gap-y-xxs" testID={testID}>
            <Text className={amountVariants({ variant })}>{valueLabel ?? quantityLabel}</Text>
            {isDefined(valueLabel) ? (
                <Text className="text-[13px] text-secondary-foreground text-right tabular-nums">{quantityLabel}</Text>
            ) : null}
        </View>
    );
};
