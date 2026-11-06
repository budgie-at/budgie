import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

export const TransactionKeypadContext = createContext({ isExpanded: false, dismiss: emptyFn });
