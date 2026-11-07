import { createContext } from 'react';

import type { ScreenChromeStickyHeadersContextInterface } from '../interface/screen-chrome-sticky-headers-context.interface';

export const ScreenChromeStickyHeadersContext = createContext<ScreenChromeStickyHeadersContextInterface | null>(null);
