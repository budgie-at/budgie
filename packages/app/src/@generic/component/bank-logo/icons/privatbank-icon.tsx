import Svg, { Path } from 'react-native-svg';

interface Props {
    readonly size?: number;
}

export const PrivatbankIcon = ({ size = 32 }: Props) => (
    <Svg width={size} height={size} viewBox="0 0 30.533 30.12" fill="none">
        <Path d="m0 30.12h11.941v-11.78h-11.941z" fill="#363636" fillRule="evenodd" />
        <Path
            d="m24.219 6.226v17.668h-2.43c-1.054-8.736-6.619-14.224-15.477-15.265v-2.403h17.908zm-24.219-6.226v14.656h3.157c8.305 0 12.52 4.155 12.52 12.35v3.113h14.856v-30.119h-30.533z"
            fill="#74b027"
            fillRule="evenodd"
        />
    </Svg>
);
