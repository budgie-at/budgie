import { Trans } from '@lingui/react/macro';
import { use } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';

export const YieldScreenTitle = () => {
    const { screenKey } = use(YieldScreenContext);

    const isFiltered = isDefined(screenKey.scopeId) || isDefined(screenKey.key.group);

    return (
        <View className="gap-y-xs">
            <Text testID={PassiveIncomeSelector.Title} className="text-3xl font-semibold text-primary" {...CHROME_TITLE_TEXT_PROPS}>
                <Trans>Passive income</Trans>
            </Text>
            {isFiltered ? null : (
                <Text testID={PassiveIncomeSelector.Subtitle} className="text-sm text-secondary-foreground">
                    <Trans>All holdings</Trans>
                </Text>
            )}
        </View>
    );
};
