import { Rect } from 'react-native-svg';

import { FlagBase } from '../component/flag-base/flag-base';

interface Props {
    readonly size?: number;
}

export const FrFlagIcon = ({ size = 20 }: Props) => (
    <FlagBase size={size} clipId="frFlagClip" backgroundColor="#FFFFFF">
        <Rect width={10} height={20} fill="#002395" />
        <Rect x={20} width={10} height={20} fill="#ED2939" />
    </FlagBase>
);
