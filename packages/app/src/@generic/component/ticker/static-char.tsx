import * as React from 'react';
import { Text } from 'react-native';

import { getTextStyleForTicket } from '../../utils/get-text-style-for-ticket.util';

interface Props {
    readonly char: string;
    readonly textSize: number;
    readonly textClassName?: string;
}

export const StaticChar = ({ char, textSize, textClassName }: Props) => {
    const style = getTextStyleForTicket(textSize);

    return (
        <Text className={textClassName} style={style}>
            {char}
        </Text>
    );
};
