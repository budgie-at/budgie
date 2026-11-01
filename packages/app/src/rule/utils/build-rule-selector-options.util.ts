import type { RuleOptionMetaInterface } from '../interface/rule-option-meta.interface';
import type { RuleSelectorOptionInterface } from '../interface/rule-selector-option.interface';
import type { MessageDescriptor } from '@lingui/core';

export const buildRuleSelectorOptions = <T extends string>(
    values: readonly T[],
    meta: Readonly<Record<T, RuleOptionMetaInterface>>,
    translate: (descriptor: MessageDescriptor) => string
): RuleSelectorOptionInterface[] =>
    values.map(value => ({
        value,
        label: translate(meta[value].label),
        description: translate(meta[value].description),
        icon: meta[value].icon,
        disabledReason: null
    }));
