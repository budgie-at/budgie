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
}

const numZeroToNine: number[] = [...Array(10).keys()];

export const Tick = ({ num, textSize, textStyle, index }: Props) => {
    const previous = usePrevious(num);
    const translateY = useSharedValue(-textSize * (previous ?? 0));

    useEffect(() => {
        translateY.set(
            withDelay(
                80 * index,
                withTiming(-textSize * num, {
                    duration: 500
                })
            )
        );
    }, [num, textSize, index, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
    }));

    const textStyles = [textStyle, getTextStyleForTicket(textSize)];
    const style = { height: textSize, overflow: 'hidden' } as const;

    return (
        <View style={style}>
            <Animated.View style={animatedStyle}>
                {numZeroToNine.map((number, index) => (
                    <Text key={index} style={textStyles}>
                        {number}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
};
