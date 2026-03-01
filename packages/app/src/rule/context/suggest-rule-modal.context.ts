import { createModalContext } from '../../@generic/utils/create-modal-context/create-modal-context.util';
import { SuggestRuleDataInterface } from '../interface/suggest-rule-data.interface';

export interface SuggestRuleModalParams {
    readonly suggestRuleData: SuggestRuleDataInterface;
}

export type SuggestRuleResultType = 'created' | 'dismissed';

export const [SuggestRuleModalContext, useSuggestRuleModal] = createModalContext<SuggestRuleModalParams, SuggestRuleResultType>(
    'dismissed'
);
