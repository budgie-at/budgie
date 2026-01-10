import { useLingui } from '@lingui/react/macro';

import { FormItem } from '../../../@generic/component/form-item/form-item';
import { RuleConditionMccSelectorContent } from '../rule-condition-mcc-selector-content/rule-condition-mcc-selector-content';

interface Props {
    readonly index: number;
}

export const RuleConditionMccSelector = ({ index }: Props) => {
    const { t } = useLingui();

    return (
        <FormItem label={t`Value`}>
            <RuleConditionMccSelectorContent index={index} />
        </FormItem>
    );
};
