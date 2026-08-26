import { isDefined } from '@rnw-community/shared';

import type { Ref, RefCallback } from 'react';

export const mergeRefs =
    <TRef>(...refs: readonly (Ref<TRef> | undefined)[]): RefCallback<TRef> =>
    (instance: TRef | null): void => {
        refs.forEach(ref => {
            if (!isDefined(ref)) {
                return;
            }

            if (typeof ref === 'function') {
                ref(instance);

                return;
            }

            ref.current = instance;
        });
    };
