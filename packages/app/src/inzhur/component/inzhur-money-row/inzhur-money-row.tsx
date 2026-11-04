import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

interface Props {
    readonly label: string;
    readonly caption?: string;
    readonly amount: number;
    readonly instrumentSymbol: string;
}

const rowVariants = cva('min-h-[44px] justify-center', {
    variants: { isStacked: { true: 'gap-y-xs', false: 'flex-row items-center gap-x-xl' } }
});

export const InzhurMoneyRow = ({ label, caption, amount, instrumentSymbol }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    return (
        <View accessible className={rowVariants({ isStacked })}>
            <View className="flex-1 gap-y-xxs">
                <Text className="text-[17px] text-primary">{label}</Text>
                {isDefined(caption) ? <Text className="text-[13px] leading-[18px] text-secondary-foreground">{caption}</Text> : null}
            </View>
            <MoneyText amount={amount} instrumentSymbol={instrumentSymbol} variant={MoneyTextVariantEnum.ROW} />
        </View>
    );
};
