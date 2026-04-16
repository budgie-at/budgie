import { ReactNode } from 'react';
import { ScrollView, ViewStyle } from 'react-native';

interface Props {
    readonly children: ReactNode;
    readonly topSpacing?: number;
    readonly alignToBottom?: boolean;
}

const DEFAULT_TOP_PADDING = 16;
const DEFAULT_BOTTOM_PADDING = 24;
const HORIZONTAL_PADDING = 12;
const ITEM_GAP = 8;

export const FilterSheetList = ({ children, topSpacing = 0, alignToBottom = false }: Props) => {
    const contentContainerStyle: ViewStyle = {
        paddingTop: DEFAULT_TOP_PADDING + topSpacing,
        paddingBottom: DEFAULT_BOTTOM_PADDING,
        paddingHorizontal: HORIZONTAL_PADDING,
        gap: ITEM_GAP,
        ...(alignToBottom && { flexGrow: 1, justifyContent: 'flex-end' })
    };

    return (
        <ScrollView
            className="flex-1"
            contentContainerStyle={contentContainerStyle}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            {children}
        </ScrollView>
    );
};
