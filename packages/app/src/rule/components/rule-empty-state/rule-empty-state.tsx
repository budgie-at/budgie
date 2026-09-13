import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { RulesPageSelector } from '../../selector/rules-page.selector';
import { RulesFeatureIntro } from '../rules-feature-intro/rules-feature-intro';

interface Props {
    readonly search: string;
}

export const RuleEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    if (isNotEmptyString(search)) {
        return (
            <SearchablePageEmptyState
                testID={RulesPageSelector.EmptyState}
                icon={UserIconNameEnum.Search}
                title={t`No Results`}
                description={t`Try a different search term`}
            />
        );
    }

    return <RulesFeatureIntro />;
};
