import { RuleConditionFieldEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { RuleOptionMetaInterface } from '../interface/rule-option-meta.interface';

export const RULE_CONDITION_FIELD: Record<RuleConditionFieldEnum, RuleOptionMetaInterface> = {
    [RuleConditionFieldEnum.TITLE]: {
        label: msg`Title`,
        phrase: msg`title`,
        description: msg`Merchant or payment description`,
        icon: UserIconNameEnum.Type,
        variant: 'ghost'
    },
    [RuleConditionFieldEnum.COMMENT]: {
        label: msg`Comment`,
        phrase: msg`comment`,
        description: msg`The note on a payment`,
        icon: UserIconNameEnum.MessageSquareText,
        variant: 'ghost'
    },
    [RuleConditionFieldEnum.AMOUNT]: {
        label: msg`Amount`,
        phrase: msg`amount`,
        description: msg`Payment size in its account currency`,
        icon: UserIconNameEnum.Banknote,
        variant: 'ghost'
    },
    [RuleConditionFieldEnum.ACCOUNT_ID]: {
        label: msg`Account`,
        phrase: msg`account`,
        description: msg`Where the payment happened`,
        icon: UserIconNameEnum.Wallet,
        variant: 'ghost'
    },
    [RuleConditionFieldEnum.MCC_CODE]: {
        label: msg`Merchant category`,
        shortLabel: msg`MCC`,
        phrase: msg`merchant category`,
        description: msg`Card network code (MCC)`,
        icon: UserIconNameEnum.Store,
        variant: 'ghost'
    },
    [RuleConditionFieldEnum.TRANSACTION_TYPE]: {
        label: msg`Type`,
        phrase: msg`type`,
        description: msg`Expense, income or transfer`,
        icon: UserIconNameEnum.Shapes,
        variant: 'ghost'
    },
    [RuleConditionFieldEnum.EXTERNAL_SOURCE]: {
        label: msg`Source`,
        phrase: msg`source`,
        description: msg`Bank, import or manual entry`,
        icon: UserIconNameEnum.Import,
        variant: 'ghost'
    }
};
