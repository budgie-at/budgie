import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { YieldScreenContext } from '../context/yield-screen.context';

export const useYieldPriorLabel = (): string => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);

    return screenKey.key.range === YieldRangeEnum.YEAR ? t`Previous 12 months` : t`Previous period`;
};
