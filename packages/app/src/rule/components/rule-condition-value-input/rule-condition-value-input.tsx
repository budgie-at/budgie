import { RuleConditionFieldEnum, RuleCreateInputInterface } from '@budgie/contracts';
import { useFormContext, useWatch } from 'react-hook-form';

import { RuleConditionAccountSelector } from '../rule-condition-account-selector/rule-condition-account-selector';
import { RuleConditionAmountValueInput } from '../rule-condition-amount-value-input/rule-condition-amount-value-input';
import { RuleConditionExternalSourceSelector } from '../rule-condition-external-source-selector/rule-condition-external-source-selector';
import { RuleConditionMccSelector } from '../rule-condition-mcc-selector/rule-condition-mcc-selector';
import { RuleConditionTextValueInput } from '../rule-condition-text-value-input/rule-condition-text-value-input';
import { RuleConditionTransactionTypeSelector } from '../rule-condition-transaction-type-selector/rule-condition-transaction-type-selector';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

export const RuleConditionValueInput = ({ index, testID }: Props) => {
    const { control } = useFormContext<RuleCreateInputInterface>();
    const field = useWatch({ control, name: `conditions.${index}.field` });

    switch (field) {
        case RuleConditionFieldEnum.ACCOUNT_ID:
            return <RuleConditionAccountSelector index={index} testID={testID} />;
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return <RuleConditionTransactionTypeSelector index={index} testID={testID} />;
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return <RuleConditionExternalSourceSelector index={index} testID={testID} />;
        case RuleConditionFieldEnum.MCC_CODE:
            return <RuleConditionMccSelector index={index} testID={testID} />;
        case RuleConditionFieldEnum.AMOUNT:
            return <RuleConditionAmountValueInput index={index} testID={testID} />;
        default:
            return <RuleConditionTextValueInput index={index} testID={testID} />;
    }
};
