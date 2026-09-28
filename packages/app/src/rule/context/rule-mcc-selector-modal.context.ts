import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

interface RuleMccSelectorModalParams {
    readonly selectedMcc: string | null;
}

export const [RuleMccSelectorModalContext, useRuleMccSelectorModal, useRuleMccSelectorModalParams] = createModalContext<
    RuleMccSelectorModalParams,
    string | null
>(null);
