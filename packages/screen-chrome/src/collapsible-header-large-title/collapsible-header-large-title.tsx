import { ReactNode } from 'react';

import { CollapsibleHeaderTitleLayer } from '../collapsible-header-title-layer/collapsible-header-title-layer';
import { useScreenChrome } from '../hook/use-screen-chrome.hook';

interface Props {
    readonly children: ReactNode;
}

const OUTPUT_RANGE: readonly [number, number] = [1, 0];

export const CollapsibleHeaderLargeTitle = ({ children }: Props): ReactNode => {
    const { config } = useScreenChrome();
    const inputRange: readonly [number, number] = [config.collapseStart, config.largeTitleEnd];

    return (
        <CollapsibleHeaderTitleLayer inputRange={inputRange} outputRange={OUTPUT_RANGE} alignItems="flex-start">
            {children}
        </CollapsibleHeaderTitleLayer>
    );
};
