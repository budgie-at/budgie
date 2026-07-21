import { Rect } from 'react-native-svg';

import { FlagBase } from '../component/flag-base/flag-base';

interface Props {
    readonly size?: number;
}

export const EsFlagIcon = ({ size = 20 }: Props) => (
    <FlagBase size={size} clipId="esFlagClip" backgroundColor="#AA151B">
        <Rect y={5} width={30} height={10} fill="#F1BF00" />
    </FlagBase>
);
