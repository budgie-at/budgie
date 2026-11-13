import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BrokerageSelector } from '../../selector/brokerage.selector';

import type { SecurityTradeFormValues } from '../../constant/security-trade-form-schema.constant';

interface Props {
    readonly title: string;
    readonly feeSign: 1 | -1;
    readonly currencySymbol: string;
    readonly maxQuantity: number | null;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const SecurityTradeAmountSection = ({ title, feeSign, currencySymbol, maxQuantity }: Props) => {
    const [quantity, price, fee] = useWatch<SecurityTradeFormValues, ['quantity', 'price', 'fee']>({ name: ['quantity', 'price', 'fee'] });
    const protectAmount = useProtectedAmountLabel();

    const amount = quantity * price + feeSign * fee;
    const isOverHolding = isDefined(maxQuantity) && quantity > maxQuantity;
    const accessibilityLabel = isOverHolding ? title : `${title}, ${protectAmount(amount, currencySymbol)}`;

    return (
        <View>
            <GroupedListSectionTitle title={title} />
            <View
                accessible
                accessibilityLabel={accessibilityLabel}
                className="min-h-[64px] justify-center rounded-3xl bg-surface-row px-3xl py-lg"
                style={CONTINUOUS_CORNERS}
                testID={BrokerageSelector.TradeTotal}
            >
                {isOverHolding ? (
                    <Text className="text-[40px] font-semibold tracking-[-1px] text-secondary-foreground">—</Text>
                ) : (
                    <MoneyText amount={amount} instrumentSymbol={currencySymbol} variant={MoneyTextVariantEnum.FIELD} tone="primary" />
                )}
            </View>
        </View>
    );
};
