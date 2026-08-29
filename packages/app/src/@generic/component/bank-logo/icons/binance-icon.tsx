import Svg, { Rect, Text } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const BinanceIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect width="64" height="64" rx="14" fill="#1E2026" />
        <Text x="32" y="38" fontSize="11" fontWeight="bold" fill="#F0B90B" textAnchor="middle">
            binance
        </Text>
    </Svg>
);
