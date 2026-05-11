import type { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { Control } from 'react-hook-form';

export interface UseSuggestRuleDetectionParamsInterface {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly control: Control<TransactionCreateInputInterface>;
}
