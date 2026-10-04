import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { getTextStyleForTicket } from '../../utils/get-text-style-for-ticket.util';

interface Props {
    readonly num: number;
    readonly textSize: number;
    readonly textClassName?: string;
    readonly index: number;
    readonly duration?: number;
    readonly delay?: number;
}

const NUM_FROM_ZERO_TO_NINE = [...Array(10).keys()];

export const Tick = (props: Props) => {
    const { num, textSize, textClassName, index, duration = 500, delay = 50 } = props;

    const translateY = useSharedValue(-textSize * num);

    useEffect(() => {
        translateY.set(withDelay(delay * index, withTiming(-textSize * num, { duration })));
    }, [num, textSize, index, translateY, delay, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    const textStyle = getTextStyleForTicket(textSize);
    const style = { height: textSize, overflow: 'hidden' } as const;

    return (
        <View style={style}>
            <Animated.View style={animatedStyle}>
                {NUM_FROM_ZERO_TO_NINE.map((number, index) => (
                    <Text key={index} className={textClassName} style={textStyle}>
                        {number}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
};
