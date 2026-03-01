import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';

interface RuleSelectorOptionInterface {
    readonly value: string;
    readonly label: string;
}

interface RuleSelectorModalParams {
    readonly title: string;
    readonly options: RuleSelectorOptionInterface[];
    readonly selectedValue: string | null;
}

export const [RuleSelectorModalContext, useRuleSelectorModal] = createModalContext<RuleSelectorModalParams, string | null>(null);
