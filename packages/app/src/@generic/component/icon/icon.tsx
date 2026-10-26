import { isEmojiIcon, UserIconType } from '@budgie/contracts';
import { Text } from 'react-native';

import { isNumber } from '@rnw-community/shared';

import { ReiconIcon } from '../reicon-icon/reicon-icon';

import type { IconProps } from 'reicon-react-native';
import type { ApplyUniwind } from 'uniwind';

interface Props extends ApplyUniwind<Omit<IconProps, 'weight'>> {
    readonly icon: UserIconType;
}

export const Icon = ({ icon, ...rest }: Props) => {
    if (isEmojiIcon(icon)) {
        const emojiSize = isNumber(rest.size) ? rest.size : 24;
        const emojiStyle = { fontSize: emojiSize * 0.8, lineHeight: emojiSize, textAlign: 'center' as const };

        return (
            <Text style={emojiStyle} allowFontScaling={false}>
                {icon}
            </Text>
        );
    }

    return <ReiconIcon icon={icon} {...rest} />;
};
