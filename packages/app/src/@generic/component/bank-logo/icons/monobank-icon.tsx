/* eslint-disable lingui/no-unlocalized-strings */
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const MonobankIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Rect width="64" height="64" rx="14" fill="#000000" />
        <Ellipse cx="22" cy="30" rx="5" ry="6" fill="#FFFFFF" />
        <Ellipse cx="42" cy="30" rx="5" ry="6" fill="#FFFFFF" />
        <Circle cx="22" cy="31" r="2.5" fill="#000000" />
        <Circle cx="42" cy="31" r="2.5" fill="#000000" />
        <Ellipse cx="32" cy="40" rx="4" ry="2.5" fill="#FFFFFF" />
        <Path d="M28 42 Q32 46 36 42" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
        <Path d="M8 8 L18 22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <Path d="M56 8 L46 22" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </Svg>
);
