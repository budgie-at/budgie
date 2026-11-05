import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { MoneyText } from '../../../@generic/component/money-text/money-text';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { MoneyTextVariantEnum } from '../../../@generic/enum/money-text-variant.enum';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly label: string;
    readonly caption?: string;
    readonly amount: number;
    readonly instrumentSymbol: string;
    readonly icon?: UserIconType;
    readonly iconClassName?: string;
}

export const InzhurMoneyRow = ({ label, caption, amount, instrumentSymbol, icon, iconClassName }: Props) => {
    const isStacked = useIsAccessibilityTextSize();
    const labelLineProps = isStacked ? {} : { numberOfLines: 1 };

    return (
        <View accessible className="min-h-[44px] flex-row items-start gap-x-xl">
            {isDefined(icon) ? <NeutralIconTile icon={icon} iconClassName={iconClassName} /> : null}
            <View className="min-h-[40px] flex-1 justify-center gap-y-xxs">
                <View className="flex-row items-baseline gap-x-xl">
                    <Text className="flex-1 text-[17px] text-primary" {...labelLineProps}>
                        {label}
                    </Text>
                    {isStacked ? null : (
                        <MoneyText amount={amount} instrumentSymbol={instrumentSymbol} variant={MoneyTextVariantEnum.ROW} />
                    )}
                </View>
                {isDefined(caption) ? <Text className="text-[13px] leading-[18px] text-secondary-foreground">{caption}</Text> : null}
                {isStacked ? <MoneyText amount={amount} instrumentSymbol={instrumentSymbol} variant={MoneyTextVariantEnum.ROW} /> : null}
            </View>
        </View>
    );
};
