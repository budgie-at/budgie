import { isNotEmptyString } from '@rnw-community/shared';

import { buildContextParts } from './build-context-parts.util';

export const buildTransactionContext = (title: string, mccDescription: string | null, comment: string): string =>
    buildContextParts([
        { label: 'Transaction', value: title },
        { label: 'Type', value: mccDescription },
        { label: isNotEmptyString(title) ? 'Note' : 'Transaction', value: comment }
    ]);
