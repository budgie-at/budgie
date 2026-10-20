import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

import { accountCountAtom } from './use-is-onboarding-active.hook';

import type { OnboardingFileStateInterface } from '../interface/onboarding-file-state.interface';

export const useOnboardingFileState = (): OnboardingFileStateInterface => {
    const { t } = useLingui();
    const isPinEnabled = useSetting('isPinEnabled');
    const accountCount = AsyncResult.getOrElse(useLiveAtomValue(accountCountAtom), () => []).at(0)?.count ?? 0;

    const contents = isPositiveNumber(accountCount)
        ? t({ message: plural(accountCount, { one: '# account', other: '# accounts' }) })
        : t`empty`;
    const state = isPinEnabled ? t`Sealed · ${contents}` : t`Phone lock only · ${contents}`;

    return { state, isSealed: isPinEnabled };
};
