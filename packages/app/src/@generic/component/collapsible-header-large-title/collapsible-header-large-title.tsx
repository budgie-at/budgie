import { View } from 'react-native';

import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly hasLeadingSlot?: boolean;
    readonly hasTrailingSlot?: boolean;
}

const TITLE_LAYER_HORIZONTAL_PADDING = 72;
const HEADER_HORIZONTAL_PADDING = 16;
const HEADER_SLOT_WIDTH = 44;

export const CollapsibleHeaderLargeTitle = ({ children, hasLeadingSlot = false, hasTrailingSlot = false }: Props): ReactNode => {
    const leadingSlotWidth = hasLeadingSlot ? HEADER_SLOT_WIDTH : 0;
    const trailingSlotWidth = hasTrailingSlot ? HEADER_SLOT_WIDTH : 0;
    const style = {
        alignSelf: 'stretch',
        marginHorizontal: -TITLE_LAYER_HORIZONTAL_PADDING,
        paddingLeft: HEADER_HORIZONTAL_PADDING + leadingSlotWidth,
        paddingRight: HEADER_HORIZONTAL_PADDING + trailingSlotWidth
    } satisfies ViewStyle;

    return <View style={style}>{children}</View>;
};
