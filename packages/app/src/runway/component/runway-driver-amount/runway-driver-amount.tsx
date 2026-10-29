import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';

interface Props {
    readonly monthlyAmount: number;
    readonly isFolded: boolean;
}

const amountVariants = cva('text-sm tabular-nums', {
    variants: {
        isFolded: {
            true: 'font-medium text-secondary-foreground',
            false: 'font-semibold text-primary'
        }
    }
});

export const RunwayDriverAmount = ({ monthlyAmount, isFolded }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useFormatDigits(0);

    return (
        <View className="flex-row items-baseline gap-x-xs">
            <Text numberOfLines={1} className={amountVariants({ isFolded })}>
                {formatDigits(convertFromMicroUnits(monthlyAmount), defaultInstrument.symbol)}
            </Text>
            <Text className="text-sm tabular-nums text-secondary-foreground">
                <Trans>/ mo</Trans>
            </Text>
        </View>
    );
};
