import { ComponentProps } from 'react';
import { Text } from 'react-native';

const systemFontStyle = { fontFamily: 'System' };

export const EmojiText = ({ style, ...rest }: ComponentProps<typeof Text>) => {
    const mergedStyle = [style, systemFontStyle];

    return <Text {...rest} style={mergedStyle} />;
};
