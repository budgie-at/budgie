import {
    ExternalSourceEnum,
    RuleConditionFieldEnum,
    RuleCreateInputInterface,
    TransactionTypeEnum,
    UserIconNameEnum
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useFormContext, useWatch } from 'react-hook-form';

import { TRANSACTION_TYPE } from '../../../transaction/constant/transaction-type.constant';
import { EXTERNAL_SOURCE } from '../../constant/external-source.constant';
import { RuleConditionAccountSelector } from '../rule-condition-account-selector/rule-condition-account-selector';
import { RuleConditionAmountValueInput } from '../rule-condition-amount-value-input/rule-condition-amount-value-input';
import { RuleConditionMccSelector } from '../rule-condition-mcc-selector/rule-condition-mcc-selector';
import { RuleConditionTextValueInput } from '../rule-condition-text-value-input/rule-condition-text-value-input';
import { RuleConditionValueEnumSelector } from '../rule-condition-value-enum-selector/rule-condition-value-enum-selector';

const TRANSACTION_TYPE_ICON: Record<TransactionTypeEnum, UserIconNameEnum> = {
    [TransactionTypeEnum.EXPENSE]: UserIconNameEnum.ArrowUpRight,
    [TransactionTypeEnum.INCOME]: UserIconNameEnum.ArrowDownLeft,
    [TransactionTypeEnum.TRANSFER]: UserIconNameEnum.ArrowRightLeft,
    [TransactionTypeEnum.DEBT]: UserIconNameEnum.HandCoins,
    [TransactionTypeEnum.ADJUSTMENT]: UserIconNameEnum.SlidersHorizontal
};

const EXTERNAL_SOURCE_OPTIONS = Object.values(ExternalSourceEnum).map(value => ({
    value,
    label: EXTERNAL_SOURCE[value],
    icon: UserIconNameEnum.Import
}));

const TRANSACTION_TYPE_OPTIONS = Object.values(TransactionTypeEnum).map(value => ({
    value,
    label: TRANSACTION_TYPE[value],
    icon: TRANSACTION_TYPE_ICON[value]
}));

interface Props {
    readonly index: number;
    readonly testID?: string;
    readonly secondaryTestID?: string;
}

export const RuleConditionValueInput = ({ index, testID, secondaryTestID }: Props) => {
    const { t } = useLingui();
    const { control } = useFormContext<RuleCreateInputInterface>();
    const field = useWatch({ control, name: `conditions.${index}.field` });

    switch (field) {
        case RuleConditionFieldEnum.ACCOUNT_ID:
            return <RuleConditionAccountSelector index={index} testID={testID} />;
        case RuleConditionFieldEnum.TRANSACTION_TYPE:
            return (
                <RuleConditionValueEnumSelector
                    index={index}
                    options={TRANSACTION_TYPE_OPTIONS}
                    icon={UserIconNameEnum.Shapes}
                    sheetTitle={t`Transaction type`}
                    placeholder={t`Choose a type`}
                    testID={testID}
                />
            );
        case RuleConditionFieldEnum.EXTERNAL_SOURCE:
            return (
                <RuleConditionValueEnumSelector
                    index={index}
                    options={EXTERNAL_SOURCE_OPTIONS}
                    icon={UserIconNameEnum.Import}
                    sheetTitle={t`Source`}
                    placeholder={t`Choose a source`}
                    testID={testID}
                />
            );
        case RuleConditionFieldEnum.MCC_CODE:
            return <RuleConditionMccSelector index={index} testID={testID} />;
        case RuleConditionFieldEnum.AMOUNT:
            return <RuleConditionAmountValueInput index={index} testID={testID} secondaryTestID={secondaryTestID} />;
        case RuleConditionFieldEnum.TITLE:
        case RuleConditionFieldEnum.COMMENT:
        default:
            return <RuleConditionTextValueInput index={index} testID={testID} />;
    }
};
