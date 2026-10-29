import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';
import { useRunwayTickLabel } from '../../hook/use-runway-tick-label.hook';

interface Props {
    readonly index: number;
}

const LAST_TICK_INDEX = RUNWAY_HORIZON_MONTHS.length - 1;
const PERCENT_MULTIPLIER = 100;

const tickVariants = cva('absolute w-[48px]', {
    variants: {
        position: {
            first: 'items-start',
            middle: '-ms-[24px] items-center',
            last: '-ms-[48px] items-end'
        }
    }
});

export const RunwayMeterTick = ({ index }: Props) => {
    const getTickLabel = useRunwayTickLabel();

    const middlePosition = index === LAST_TICK_INDEX ? 'last' : 'middle';
    const position = index === 0 ? 'first' : middlePosition;
    const label = getTickLabel(index);
    const start: `${number}%` = `${(index / LAST_TICK_INDEX) * PERCENT_MULTIPLIER}%`;
    const positionStyle = { start };

    return (
        <View className={tickVariants({ position })} style={positionStyle}>
            <Text className="text-xxs text-secondary-foreground">{label}</Text>
        </View>
    );
};
