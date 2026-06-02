import { plural } from '@lingui/core/macro';

import type { useLingui } from '@lingui/react/macro';

export const getBankSyncRepairText = (count: number, t: ReturnType<typeof useLingui>['t']) =>
    t({
        message: plural(count, {
            one: '# bank sync repair',
            other: '# bank sync repairs'
        })
    });
