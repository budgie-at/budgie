import type { RuleWithRelationsEntityInterface } from '@budgie/contracts';

export interface RuleTransactionMatchInterface {
    readonly transactionId: number;
    readonly matchingRules: RuleWithRelationsEntityInterface[];
}
