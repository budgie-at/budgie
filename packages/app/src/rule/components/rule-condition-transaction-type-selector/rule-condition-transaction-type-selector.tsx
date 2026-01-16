import { useLingui } from '@lingui/react/macro';

import { typedObjectEntries } from '../../../@generic/utils/typed-object-entries.util';
import { TRANSACTION_TYPE } from '../../../transaction/constant/transaction-type.constant';
import { RuleConditionValueEnumSelector } from '../rule-condition-value-enum-selector/rule-condition-value-enum-selector';

interface Props {
    readonly index: number;
    readonly testID?: string;
}

const TRANSACTION_TYPE_OPTIONS = typedObjectEntries(TRANSACTION_TYPE).map(([value, label]) => ({
    value,
    label
}));

export const RuleConditionTransactionTypeSelector = ({ index, testID }: Props) => {
    const { t } = useLingui();

    return (
        <RuleConditionValueEnumSelector
            index={index}
            options={TRANSACTION_TYPE_OPTIONS}
            sheetTitle={t`Select Transaction Type`}
            defaultLabel={t`Select type`}
            testID={testID}
        />
    );
};
