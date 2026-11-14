import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { hasYieldFamily } from '../../constant/has-yield-family-atom.constant';
import { YieldEntryRowContent } from '../yield-entry-row-content/yield-entry-row-content';

import type { YieldScopeInterface } from '@budgie/contracts';

interface Props {
    readonly scope: YieldScopeInterface;
}

export const YieldEntryRow = ({ scope }: Props) => {
    const hasYieldFor = AsyncResult.getOrElse(useLiveAtomValue(hasYieldFamily(scope)), () => false);

    return hasYieldFor ? <YieldEntryRowContent scope={scope} /> : null;
};
