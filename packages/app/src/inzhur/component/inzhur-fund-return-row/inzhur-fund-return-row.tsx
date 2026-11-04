import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';

interface Props {
    readonly label: string;
    readonly value: string;
}

const rowVariants = cva('min-h-[44px] px-3xl py-md', {
    variants: { isStacked: { true: 'gap-y-xs', false: 'flex-row items-start gap-x-xl' } }
});

export const InzhurFundReturnRow = ({ label, value }: Props) => {
    const isStacked = useIsAccessibilityTextSize();

    return (
        <View accessible className={rowVariants({ isStacked })}>
            <Text className="flex-1 text-[15px] leading-[20px] text-primary">{label}</Text>
            <ProtectedText className="text-[15px] leading-[20px] font-semibold text-primary tabular-nums">{value}</ProtectedText>
        </View>
    );
};
