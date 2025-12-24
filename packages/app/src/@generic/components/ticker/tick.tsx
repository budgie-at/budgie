import { useEffect } from 'react';
import { Text, TextStyle, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { usePrevious } from '../../hooks/use-previous.hook';
import { getTextStyleForTicket } from '../../utils/get-text-style-for-ticket.util';

interface Props {
    readonly num: number;
    readonly textSize: number;
    readonly textStyle?: TextStyle;
    readonly index: number;
    readonly duration?: number;
    readonly delay?: number;
}

const NUM_FROM_ZERO_TO_NINE = [...Array(10).keys()];

export const Tick = (props: Props) => {
    const { num, textSize, textStyle, index, duration = 500, delay = 50 } = props;

    const previous = usePrevious(num);
    const translateY = useSharedValue(-textSize * (previous ?? 0));

    useEffect(() => {
        translateY.set(withDelay(delay * index, withTiming(-textSize * num, { duration })));
    }, [num, textSize, index, translateY, delay, duration]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    const textStyles = [textStyle, getTextStyleForTicket(textSize)];
    const style = { height: textSize, overflow: 'hidden' } as const;

    return (
        <View style={style}>
            <Animated.View style={animatedStyle}>
                {NUM_FROM_ZERO_TO_NINE.map((number, index) => (
                    <Text key={index} style={textStyles}>
                        {number}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
};
