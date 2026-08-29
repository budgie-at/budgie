import { plural } from '@lingui/core/macro';

import type { useLingui } from '@lingui/react/macro';

export const getSyncRepairText = (count: number, t: ReturnType<typeof useLingui>['t']) =>
    t({
        message: plural(count, {
            one: '# sync repair',
            other: '# sync repairs'
        })
    });
