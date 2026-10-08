import { TransactionTypeEnum } from '@budgie/contracts';

import type { CategorizeInboxRowInterface } from '@budgie/categorization';
import type { Href } from 'expo-router';

export const getCategorizeInboxRowHref = ({ transactionId, type }: Pick<CategorizeInboxRowInterface, 'transactionId' | 'type'>): Href => ({
    pathname: type === TransactionTypeEnum.INCOME ? '/transactions/[id]/income' : '/transactions/[id]/expense',
    params: { id: String(transactionId) }
});
