import { useState } from 'react';
import { Text } from 'react-native';

import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { YIELD_SUBTITLE_SEPARATOR } from '../../constant/yield-subtitle-separator.constant';

import type { NativeSyntheticEvent, TextLayoutEventData } from 'react-native';

interface Props {
    readonly subtitle: string;
}

const SUBTITLE_LINES = 2;

export const YieldRowSubtitle = ({ subtitle }: Props) => {
    const [isStacked, setIsStacked] = useState(false);

    const handleTextLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
        if (event.nativeEvent.lines.length > 1) {
            setIsStacked(true);
        }
    };

    const text = isStacked ? subtitle.split(YIELD_SUBTITLE_SEPARATOR).join('\n') : subtitle;

    return (
        <Text
            className="text-[13px] leading-[18px] text-secondary-foreground"
            numberOfLines={SUBTITLE_LINES}
            maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            onTextLayout={handleTextLayout}
        >
            {text}
        </Text>
    );
};
