import { RuleActionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { RuleOptionMetaInterface } from '../interface/rule-option-meta.interface';

export const RULE_ACTION_TYPE: Record<RuleActionTypeEnum, RuleOptionMetaInterface> = {
    [RuleActionTypeEnum.SET_CATEGORY]: {
        label: msg`Set category`,
        phrase: msg`move to`,
        description: msg`Move matching payments to a category`,
        icon: UserIconNameEnum.FolderOpen,
        variant: 'violet'
    },
    [RuleActionTypeEnum.ADD_TAG]: {
        label: msg`Add tag`,
        phrase: msg`add tag`,
        description: msg`Label matching payments with a tag`,
        icon: UserIconNameEnum.Tag,
        variant: 'pink'
    },
    [RuleActionTypeEnum.CONVERT_TO_TRANSFER]: {
        label: msg`Convert to transfer`,
        phrase: msg`make a transfer with`,
        description: msg`Turn payments into transfers between accounts`,
        icon: UserIconNameEnum.ArrowRightLeft,
        variant: 'cyan'
    }
};
