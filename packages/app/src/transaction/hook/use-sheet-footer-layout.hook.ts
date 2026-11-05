import { useState } from 'react';

import type { LayoutChangeEvent } from 'react-native';

export const useSheetFooterLayout = () => {
    const [footerHeight, setFooterHeight] = useState(0);

    const handleFooterLayout = (event: LayoutChangeEvent) => {
        setFooterHeight(event.nativeEvent.layout.height);
    };

    return { contentContainerStyle: { paddingBottom: footerHeight }, handleFooterLayout };
};
