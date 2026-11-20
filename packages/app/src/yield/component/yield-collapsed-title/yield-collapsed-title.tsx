import { Trans, useLingui } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YIELD_GROUP_LABEL } from '../../constant/yield-group-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { useYieldScopeTitle } from '../../hook/use-yield-scope-title.hook';

export const YieldCollapsedTitle = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const scopeTitle = useYieldScopeTitle();

    const { group } = screenKey.key;
    const scopes = [isDefined(screenKey.scopeId) ? scopeTitle : null, isDefined(group) ? t(YIELD_GROUP_LABEL[group]) : null].filter(
        isDefined
    );

    return (
        <View className="items-center">
            <Text className="text-center text-lg font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            {isNotEmptyArray(scopes) ? (
                <Text className="text-center text-xs text-secondary-foreground" {...CHROME_TITLE_TEXT_PROPS}>
                    {scopes.join(' · ')}
                </Text>
            ) : null}
        </View>
    );
};
