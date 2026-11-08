import { createContext } from 'react';

import { emptyFn } from '@rnw-community/shared';

export const TransactionKeypadContext = createContext({ dismiss: emptyFn, isExpanded: false });
