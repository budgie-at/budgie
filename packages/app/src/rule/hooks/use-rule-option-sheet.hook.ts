import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useRuleSelectorModal } from '../context/rule-selector-modal.context';

import type { RuleOptionMetaInterface } from '../interface/rule-option-meta.interface';
import type { RuleOptionSheetRequestInterface } from '../interface/rule-option-sheet-request.interface';

export const useRuleOptionSheet = <T extends string>(title: string, meta: Readonly<Record<T, RuleOptionMetaInterface>>) => {
    const { t } = useLingui();
    const [openRuleSelector] = useRuleSelectorModal();
    const disabledReason = t`Already in this rule`;

    return ({ values, selectedValue, disabledValues, onSelect }: RuleOptionSheetRequestInterface<T>) => {
        const options = values.map(value => ({
            value,
            label: t(meta[value].label),
            description: t(meta[value].description),
            icon: meta[value].icon,
            disabledReason: disabledValues?.has(value) === true ? disabledReason : null
        }));

        openRuleSelector({ title, options, selectedValue }, result => {
            const nextValue = values.find(value => value === result);

            if (isDefined(nextValue)) {
                onSelect(nextValue);
            }
        });
    };
};
