import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { EdgeFade } from '../edge-fade/edge-fade';

import type { ReactNode } from 'react';

export const CollapsibleHeaderBackdrop = (): ReactNode => {
    const { config } = useScreenChrome();
    const scrollAnimation = {
        opacityInputRange: [config.collapseStart, config.smallTitleStart] as const,
        intensityInputRange: [config.collapseStart, config.collapseEnd] as const
    };

    return <EdgeFade position="top" height={config.headerBackdropHeight} scrollAnimation={scrollAnimation} />;
};
