import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';

interface Props {
    readonly index: number;
}

const LAST_TICK_INDEX = RUNWAY_HORIZON_MONTHS.length - 1;
const PERCENT_MULTIPLIER = 100;

const tickVariants = cva('absolute w-[40px]', {
    variants: {
        position: {
            first: 'items-start',
            middle: '-ms-[20px] items-center',
            last: '-ms-[40px] items-end'
        }
    }
});

export const RunwayMeterTick = ({ index }: Props) => {
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);

    const middlePosition = index === LAST_TICK_INDEX ? 'last' : 'middle';
    const position = index === 0 ? 'first' : middlePosition;
    const label = index === 0 ? t`now` : formatDigits(RUNWAY_HORIZON_MONTHS[index]);
    const start: `${number}%` = `${(index / LAST_TICK_INDEX) * PERCENT_MULTIPLIER}%`;
    const positionStyle = { start };

    return (
        <View className={tickVariants({ position })} style={positionStyle}>
            <Text className="text-xxs text-secondary-foreground">{label}</Text>
        </View>
    );
};
