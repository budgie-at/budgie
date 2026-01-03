import { View } from 'react-native';

import { LOADING_COLOR, RING_CIRCUMFERENCE } from './animated-record-button.constant';
import { BaseRing } from './base-ring';
import { ringContainerStyle } from './ring-container.style';

interface Props {
    readonly progress: number;
}

const ROTATION_OFFSET = -90;

export const LoadingRing = ({ progress }: Props) => {
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);

    return (
        <View style={ringContainerStyle}>
            <BaseRing stroke={LOADING_COLOR} strokeDashoffset={strokeDashoffset} rotation={ROTATION_OFFSET} />
        </View>
    );
};
