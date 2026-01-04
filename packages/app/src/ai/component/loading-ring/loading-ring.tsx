import { View } from 'react-native';

import { LOADING_COLOR, RING_CIRCUMFERENCE, RING_SIZE } from '../animated-record-button/animated-record-button.constant';
import { BaseRing } from '../base-ring/base-ring';

interface Props {
    readonly progress: number;
}

const ROTATION_OFFSET = -90;

export const LoadingRing = ({ progress }: Props) => {
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
    const containerStyle = { height: RING_SIZE, width: RING_SIZE };

    return (
        <View className="absolute left-0 top-0 items-center justify-center" style={containerStyle}>
            <BaseRing stroke={LOADING_COLOR} strokeDashoffset={strokeDashoffset} rotation={ROTATION_OFFSET} />
        </View>
    );
};
