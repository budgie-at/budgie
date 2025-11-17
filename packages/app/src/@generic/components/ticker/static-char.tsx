import * as React from 'react';
import { Text, TextStyle } from 'react-native';

import { getTextStyleForTicket } from '../../utils/get-text-style-for-ticket.util';

interface Props {
    readonly char: string;
    readonly textSize: number;
    readonly textStyle?: TextStyle;
}

export const StaticChar = ({ char, textSize, textStyle }: Props) => {
    const style = [textStyle, getTextStyleForTicket(textSize)];

    return <Text style={style}>{char}</Text>;
};
