/* eslint-disable lingui/no-unlocalized-strings */
import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const PrivatbankIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect width="64" height="64" rx="14" fill="#00A650" />
        <Path
            d="M22 48V16H34C36.6522 16 39.1957 17.0536 41.0711 18.9289C42.9464 20.8043 44 23.3478 44 26C44 28.6522 42.9464 31.1957 41.0711 33.0711C39.1957 34.9464 36.6522 36 34 36H22"
            stroke="#FFFFFF"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
