import { useState } from 'react';

import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import type { LayoutChangeEvent } from 'react-native';

export const useTransactionInfoHandoff = () => {
    const { config } = useScreenChrome();
    const [revealOffset, setRevealOffset] = useState(0);
    const onAmountLayout = (event: LayoutChangeEvent) => {
        setRevealOffset(Math.max(0, event.nativeEvent.layout.y - config.headerHeight));
    };

    return { revealOffset, onAmountLayout };
};
