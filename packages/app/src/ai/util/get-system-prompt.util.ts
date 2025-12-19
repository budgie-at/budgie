import { CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { i18n } from '@lingui/core';
import { getStructuredOutputPrompt } from 'react-native-executorch';

export const getSystemPrompt = (categories: CategoryEntityInterface[]) => {
    const formattingInstructions = getStructuredOutputPrompt({
        properties: {
            category: {
                type: 'string',
                enum: categories.map(category => category.title),
                description: i18n._(`Available transaction categories`)
            },
            type: {
                type: 'string',
                enum: Object.values(TransactionTypeEnum),
                description: i18n._(`Available transaction types`)
            },
            amount: {
                type: 'number',
                description: i18n._(`Amount of money, that user spent or earned in this transaction`)
            }
        },
        required: ['category', 'type', 'amount']
    });

    return i18n._(
        `Your goal is to analyze and parse user message about the financial transaction and return them in JSON format. Don't respond to user. Simply return JSON with user's transaction data parsed. ${formattingInstructions}`
    );
};
