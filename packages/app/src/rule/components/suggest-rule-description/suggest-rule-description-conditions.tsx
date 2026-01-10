import { RuleConditionFieldEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { SuggestRuleDataInterface } from '../../interface/suggest-rule-data.interface';

interface Props {
    readonly data: SuggestRuleDataInterface;
    readonly selectedFields: RuleConditionFieldEnum[];
}

const FIELD_LABELS = {
    [RuleConditionFieldEnum.TITLE]: msg`title`,
    [RuleConditionFieldEnum.COMMENT]: msg`comment`,
    [RuleConditionFieldEnum.AMOUNT]: msg`amount`,
    [RuleConditionFieldEnum.ACCOUNT_ID]: msg`account`,
    [RuleConditionFieldEnum.MCC_CODE]: msg`MCC code`,
    [RuleConditionFieldEnum.TRANSACTION_TYPE]: msg`type`,
    [RuleConditionFieldEnum.EXTERNAL_SOURCE]: msg`source`
};

const getFieldValue = (field: RuleConditionFieldEnum, data: SuggestRuleDataInterface): string => {
    switch (field) {
        case RuleConditionFieldEnum.TITLE:
            return data.title;
        case RuleConditionFieldEnum.COMMENT:
            return data.comment ?? '';
        case RuleConditionFieldEnum.MCC_CODE:
            return data.mccCode ?? '';
        default:
            return '';
    }
};

export const SuggestRuleDescriptionConditions = ({ data, selectedFields }: Props) => {
    const { t } = useLingui();

    return (
        <>
            {selectedFields.map((field, index) => {
                const fieldLabel = t(FIELD_LABELS[field]);
                const fieldValue = getFieldValue(field, data);
                const isLast = index === selectedFields.length - 1;

                return (
                    <Text key={field} className="text-sm text-secondary-foreground">
                        <Text className="font-semibold text-primary">{fieldLabel}</Text>
                        <Trans> contains </Trans>
                        <Text className="font-semibold text-primary">&quot;{fieldValue}&quot;</Text>
                        {isLast ? '' : <Trans> and </Trans>}
                    </Text>
                );
            })}
        </>
    );
};
