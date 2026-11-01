import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RulesFeatureIntro } from '../rules-feature-intro/rules-feature-intro';

interface Props {
    readonly search: string;
    readonly onClearSearch: () => void;
}

export const RuleEmptyState = ({ search, onClearSearch }: Props) => {
    const { t } = useLingui();
    const insets = useSafeAreaInsets();
    const containerStyle = { paddingTop: insets.top + SCREEN_CHROME_CONTENT_INSET_TOP };

    return (
        <View style={containerStyle}>
            {isNotEmptyString(search) ? (
                <StatsEmptyCard
                    testID={RulesPageSelector.EmptyState}
                    icon={UserIconNameEnum.SearchX}
                    title={t`No rules match “${search}”`}
                    description={t`Try a merchant, category or tag name.`}
                >
                    <Button onPress={onClearSearch} leftIcon={UserIconNameEnum.X} content={t`Clear search`} />
                </StatsEmptyCard>
            ) : (
                <RulesFeatureIntro />
            )}
        </View>
    );
};
