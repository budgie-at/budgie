import { Rect } from 'react-native-svg';

import { FlagBase } from '../component/flag-base/flag-base';

interface Props {
    readonly size?: number;
}

export const DeFlagIcon = ({ size = 20 }: Props) => (
    <FlagBase size={size} clipId="deFlagClip" backgroundColor="#DD0000">
        <Rect width={30} height={6.667} fill="#000000" />
        <Rect y={13.333} width={30} height={6.667} fill="#FFCE00" />
    </FlagBase>
);
