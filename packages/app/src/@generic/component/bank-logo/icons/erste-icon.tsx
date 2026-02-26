import Svg, { Rect, Text } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const ErsteIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect width="64" height="64" rx="14" fill="#1A3D6D" />
        <Text x="32" y="40" fontSize="14" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            ERSTE
        </Text>
    </Svg>
);
