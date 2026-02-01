import { TransactionCreateInputInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Control } from 'react-hook-form';

import { useSuggestRuleOnUpdate } from '../../hooks/use-suggest-rule-on-update.hook';
import { SuggestRuleSection } from '../suggest-rule-section/suggest-rule-section';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly transactionInput: TransactionCreateInputInterface;
    readonly control: Control<TransactionCreateInputInterface>;
    readonly children: ReactNode;
}

export const SuggestRuleSectionWrapper = ({ transaction, transactionInput, control, children }: Props) => {
    const { shouldShowAddRule, handleCreateRule } = useSuggestRuleOnUpdate({
        transaction,
        transactionInput,
        control
    });

    if (shouldShowAddRule) {
        return <SuggestRuleSection onPress={handleCreateRule} />;
    }

    return children;
};
