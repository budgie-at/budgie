import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { enabledRulesAtom } from '../constant/enabled-rules-atom.constant';

export const useGetEnabledRulesQuery = () => {
    const result = useLiveAtomValue(enabledRulesAtom);

    return { enabledRules: AsyncResult.getOrElse(result, () => []), isLoading: AsyncResult.isInitial(result) };
};
