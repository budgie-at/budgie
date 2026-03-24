import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';

interface Props {
    readonly search: string;
}

export const ArchivedAccountsEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    const isSearching = isNotEmptyString(search);
    const icon = isSearching ? UserIconNameEnum.Search : UserIconNameEnum.Archive;
    const title = isSearching ? t`No Results` : t`No Archived Accounts`;
    const description = isSearching
        ? t`No archived accounts match your search`
        : t`Accounts you archive will appear here. They won't be included in your totals or main view.`;

    return <SearchablePageEmptyState icon={icon} title={title} description={description} />;
};
