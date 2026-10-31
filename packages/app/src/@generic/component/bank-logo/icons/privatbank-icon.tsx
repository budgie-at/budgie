import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const PrivatbankIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="-9 -9 48.533 48.12" fill="none">
        <Rect x="-9" y="-9" width="48.533" height="48.12" rx="10.5" fill="#1E2026" />
        <Path d="m0 30.12h11.941v-11.78h-11.941z" fill="#5A5A5A" fillRule="evenodd" />
        <Path
            d="m24.219 6.226v17.668h-2.43c-1.054-8.736-6.619-14.224-15.477-15.265v-2.403h17.908zm-24.219-6.226v14.656h3.157c8.305 0 12.52 4.155 12.52 12.35v3.113h14.856v-30.119h-30.533z"
            fill="#74b027"
            fillRule="evenodd"
        />
    </Svg>
);
