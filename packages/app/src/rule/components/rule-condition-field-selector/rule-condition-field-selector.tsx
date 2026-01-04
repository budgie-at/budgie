import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';

import { RuleConditionEnumSelector } from '../rule-condition-enum-selector/rule-condition-enum-selector';

const FIELD_OPTIONS = [
    { value: RuleConditionFieldEnum.TITLE, label: msg`Title` },
    { value: RuleConditionFieldEnum.AMOUNT, label: msg`Amount` },
    { value: RuleConditionFieldEnum.ACCOUNT_ID, label: msg`Account` },
    { value: RuleConditionFieldEnum.MCC_CODE, label: msg`MCC Code` },
    { value: RuleConditionFieldEnum.TRANSACTION_TYPE, label: msg`Type` },
    { value: RuleConditionFieldEnum.EXTERNAL_SOURCE, label: msg`Source` }
];

export const RuleConditionFieldSelector = ({ index }: { index: number }) => {
    const { t } = useLingui();

    return (
        <RuleConditionEnumSelector
            index={index}
            options={FIELD_OPTIONS}
            fieldName="field"
            label={<Trans>Field</Trans>}
            sheetTitle={t`Select Field`}
            defaultLabel={t`Select Field`}
        />
    );
};
