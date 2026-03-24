import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';

interface Props {
    readonly search: string;
}

export const InactiveAccountsEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    const isSearching = isNotEmptyString(search);
    const icon = isSearching ? UserIconNameEnum.Search : UserIconNameEnum.EyeOff;
    const title = isSearching ? t`No Results` : t`No Inactive Accounts`;
    const description = isSearching
        ? t`No inactive accounts match your search`
        : t`Accounts you mark as inactive will appear here. They won't be shown on the main page.`;

    return <SearchablePageEmptyState icon={icon} title={title} description={description} />;
};
