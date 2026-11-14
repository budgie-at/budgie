import { useState } from 'react';

import { CollapsibleChromeSearchContext } from '../context/collapsible-chrome-search.context';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CollapsibleChromeSearchProvider = ({ children }: Props) => {
    const [isSearchActive, setSearchActive] = useState(false);
    const search = { isSearchActive, setSearchActive };

    return <CollapsibleChromeSearchContext value={search}>{children}</CollapsibleChromeSearchContext>;
};
