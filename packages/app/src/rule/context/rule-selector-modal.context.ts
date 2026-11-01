import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

import type { RuleSelectorOptionInterface } from '../interface/rule-selector-option.interface';

interface RuleSelectorModalParams {
    readonly title: string;
    readonly options: readonly RuleSelectorOptionInterface[];
    readonly selectedValue: string | null;
}

export const [RuleSelectorModalContext, useRuleSelectorModal, useRuleSelectorModalParams] = createModalContext<
    RuleSelectorModalParams,
    string | null
>(null);
