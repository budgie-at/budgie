import Svg, { Polygon, Rect } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const BinanceIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect width="64" height="64" rx="14" fill="#1E2026" />
        <Polygon points="32,14 42,24 38,28 32,22 26,28 22,24" fill="#F0B90B" />
        <Polygon points="32,50 42,40 38,36 32,42 26,36 22,40" fill="#F0B90B" />
        <Polygon points="32,27 37,32 32,37 27,32" fill="#F0B90B" />
        <Polygon points="15,32 19,28 23,32 19,36" fill="#F0B90B" />
        <Polygon points="49,32 45,28 41,32 45,36" fill="#F0B90B" />
    </Svg>
);
