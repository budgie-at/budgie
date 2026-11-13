import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { hasYieldAtom } from '../../constant/has-yield-atom.constant';
import { YieldEntryRowScoped } from '../yield-entry-row-scoped/yield-entry-row-scoped';

import type { YieldScopeInterface } from '@budgie/contracts';

interface Props {
    readonly scope: YieldScopeInterface;
}

export const YieldEntryRow = ({ scope }: Props) => {
    const hasYield = AsyncResult.getOrElse(useLiveAtomValue(hasYieldAtom), () => false);

    return hasYield ? <YieldEntryRowScoped scope={scope} /> : null;
};
