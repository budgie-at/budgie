import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { AccountCardBalance } from '../../../account/component/account-card-balance/account-card-balance';

interface Props {
    readonly label: string;
    readonly amount: number;
    readonly instrumentSymbol: string;
}

const rowVariants = cva('min-h-[24px]', {
    variants: { isStacked: { true: 'gap-y-xs', false: 'flex-row items-baseline gap-x-xl' } }
});

export const InzhurFundReturnRow = ({ label, amount, instrumentSymbol }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    return (
        <View accessible className={rowVariants({ isStacked })}>
            <Text className="flex-1 text-[15px] leading-[20px] text-primary">{label}</Text>
            <AccountCardBalance title={label} balance={amount} instrumentSymbol={instrumentSymbol} />
        </View>
    );
};
