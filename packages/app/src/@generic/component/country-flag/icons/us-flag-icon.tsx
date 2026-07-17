import { Rect } from 'react-native-svg';

import { FlagBase } from '../component/flag-base/flag-base';

interface Props {
    readonly size?: number;
}

const STRIPE_HEIGHT = 20 / 13;
const CANTON_HEIGHT = STRIPE_HEIGHT * 7;
const RED_STRIPE_Y_POSITIONS = [0, 2, 4, 6, 8, 10, 12].map(index => index * STRIPE_HEIGHT);

export const UsFlagIcon = ({ size = 20 }: Props) => (
    <FlagBase size={size} clipId="usFlagClip" backgroundColor="#FFFFFF">
        {RED_STRIPE_Y_POSITIONS.map(y => (
            <Rect key={y} y={y} width={30} height={STRIPE_HEIGHT} fill="#B22234" />
        ))}
        <Rect width={12} height={CANTON_HEIGHT} fill="#3C3B6E" />
    </FlagBase>
);
