import { ReactNode } from 'react';

import { CollapsibleHeaderTitleLayer } from '../collapsible-header-title-layer/collapsible-header-title-layer';
import { useScreenChrome } from '../hook/use-screen-chrome.hook';

interface Props {
    readonly children: ReactNode;
}

const OUTPUT_RANGE: readonly [number, number] = [0, 1];

export const CollapsibleHeaderSmallTitle = ({ children }: Props): ReactNode => {
    const { config } = useScreenChrome();
    const inputRange: readonly [number, number] = [config.smallTitleStart, config.collapseEnd];

    return (
        <CollapsibleHeaderTitleLayer inputRange={inputRange} outputRange={OUTPUT_RANGE} alignItems="center">
            {children}
        </CollapsibleHeaderTitleLayer>
    );
};
