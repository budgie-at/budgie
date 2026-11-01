import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { StatsEmptyCard } from '../../../@generic/component/stats-empty-card/stats-empty-card';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RulesFeatureIntro } from '../rules-feature-intro/rules-feature-intro';

interface Props {
    readonly search: string;
    readonly onClearSearch: () => void;
}

export const RuleEmptyState = ({ search, onClearSearch }: Props) => {
    const { t } = useLingui();

    if (!isNotEmptyString(search)) {
        return <RulesFeatureIntro />;
    }

    return (
        <StatsEmptyCard
            testID={RulesPageSelector.EmptyState}
            icon={UserIconNameEnum.Search}
            title={t`No rules match “${search}”`}
            description={t`Try a title, category or tag name.`}
        >
            <Button onPress={onClearSearch} leftIcon={UserIconNameEnum.X} content={t`Clear search`} />
        </StatsEmptyCard>
    );
};
