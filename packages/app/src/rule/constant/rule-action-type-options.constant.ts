import { RuleActionTypeEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

interface RuleActionTypeOptionInterface {
    readonly value: RuleActionTypeEnum;
    readonly label: MessageDescriptor;
}

export const RULE_ACTION_TYPE_OPTIONS: RuleActionTypeOptionInterface[] = [
    { value: RuleActionTypeEnum.SET_CATEGORY, label: msg`Set Category` },
    { value: RuleActionTypeEnum.ADD_TAG, label: msg`Add Tag` },
    { value: RuleActionTypeEnum.CONVERT_TO_TRANSFER, label: msg`Convert to Transfer` }
];
