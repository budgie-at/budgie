import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const ErsteIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="16" fill="#E3000F" />
        <Path
            d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 2c4.418 0 8 3.582 8 8s-3.582 8-8 8-8-3.582-8-8 3.582-8 8-8zm-3 4v8h2v-3h2c1.654 0 3-1.346 3-3s-1.346-3-3-3h-4zm2 2h2c.551 0 1 .449 1 1s-.449 1-1 1h-2v-2z"
            fill="#FFFFFF"
        />
    </Svg>
);
