import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { RulesPageSelector } from '../../selector/rules-page.selector';

interface Props {
    readonly search: string;
}

export const RuleEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    const isSearching = isNotEmptyString(search);
    const icon = isSearching ? UserIconNameEnum.Search : UserIconNameEnum.Zap;
    const title = isSearching ? t`No Results` : t`No Rules Yet`;
    const description = isSearching
        ? t`Try a different search term`
        : t`Create rules to automatically categorize and tag your bank transactions`;

    return <SearchablePageEmptyState testID={RulesPageSelector.EmptyState} icon={icon} title={title} description={description} />;
};
