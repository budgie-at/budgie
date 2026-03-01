import { createModalProvider } from '../../@generic/utils/create-modal-provider/create-modal-provider.util';
import { SuggestRuleModalContext } from '../context/suggest-rule-modal.context';

import type { SuggestRuleModalParams, SuggestRuleResultType } from '../context/suggest-rule-modal.context';

export const SuggestRuleModalProvider = createModalProvider<SuggestRuleModalParams, SuggestRuleResultType>(
    SuggestRuleModalContext,
    '/suggest-rule'
);
