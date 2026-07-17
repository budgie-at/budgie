import { Rect } from 'react-native-svg';

import { FlagBase } from '../component/flag-base/flag-base';

interface Props {
    readonly size?: number;
}

export const UaFlagIcon = ({ size = 20 }: Props) => (
    <FlagBase size={size} clipId="uaFlagClip" backgroundColor="#005BBB">
        <Rect y={10} width={30} height={10} fill="#FFD500" />
    </FlagBase>
);
