import { TransactionTypeEnum } from '@budgie/contracts';

export interface LLMParsedTransaction {
    category: string;
    amount: number;
    type?: TransactionTypeEnum;
}
