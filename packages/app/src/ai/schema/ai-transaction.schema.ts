/* eslint-disable lingui/no-unlocalized-strings */
import { TransactionTypeEnum } from '@budgie/contracts';

export const AiTransactionSchema = {
    properties: {
        category: {
            type: 'string',
            enum: [''],
            description: 'Available transaction categories'
        },
        type: {
            type: 'string',
            enum: Object.values(TransactionTypeEnum),
            description: 'Available transaction types'
        },
        amount: {
            type: 'number',
            description: 'Amount of money, that user spent or earned in this transaction'
        }
    },
    required: ['category', 'type', 'amount']
};
