import { CategoryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { getStructuredOutputPrompt } from 'react-native-executorch';

// eslint-disable-next-line react-hooks/rules-of-hooks
const { t } = useLingui();

export const getSystemPrompt = (categories: CategoryEntityInterface[]) => {
    const formattingInstructions = getStructuredOutputPrompt({
        properties: {
            category: {
                type: 'string',
                enum: categories.map(category => category.title),
                description: t`Available transaction categories`
            },
            type: {
                type: 'string',
                enum: Object.values(TransactionTypeEnum),
                description: t`Available transaction types`
            },
            amount: {
                type: 'number',
                description: t`Amount of money, that user spent or earned in this transaction`
            }
        },
        required: ['category', 'type', 'amount']
    });

    return t`Your goal is to analyze and parse user message about the financial transaction and return them in JSON format. Don't respond to user. Simply return JSON with user's transaction data parsed. ${formattingInstructions}`;
};
