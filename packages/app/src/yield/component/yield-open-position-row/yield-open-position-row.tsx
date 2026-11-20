import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { use } from 'react';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldOpenPositionRow = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();

    const { positionAccountId, instrumentId } = screenKey.key;

    if (!isDefined(screenKey.scopeId) || screenKey.from === screenKey.scopeId) {
        return null;
    }

    const title = isNotEmptyString(scopeTitle) ? t`Open ${scopeTitle}` : t`Open holding`;

    const handlePress = () => {
        if (isDefined(positionAccountId)) {
            router.push({ pathname: '/account/[id]/details', params: { id: String(positionAccountId) } });

            return;
        }

        if (isDefined(instrumentId)) {
            router.push({ pathname: '/currency/[id]', params: { id: String(instrumentId) } });
        }
    };

    return <GroupedListRow title={title} onPress={handlePress} testID={PassiveIncomeSelector.OpenPosition} />;
};
