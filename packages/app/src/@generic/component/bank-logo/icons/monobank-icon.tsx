import Svg, { Defs, LinearGradient, Rect, Stop, Text } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const MonobankIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
            <LinearGradient id="monoGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#3D3D3D" />
                <Stop offset="100%" stopColor="#1A1A1A" />
            </LinearGradient>
        </Defs>
        <Rect width="64" height="64" rx="14" fill="url(#monoGradient)" />
        <Text x="32" y="40" fontSize="18" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
            mono
        </Text>
    </Svg>
);
