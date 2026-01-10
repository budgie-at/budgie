import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';

interface Props {
    readonly search: string;
}

export const CategoryEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    const isSearching = isNotEmptyString(search);
    const icon = isSearching ? UserIconNameEnum.Search : UserIconNameEnum.Folder;
    const title = isSearching ? t`No Results` : t`No Custom Categories`;
    const description = isSearching ? t`No categories match your search` : t`Custom categories you create will appear here`;

    return <SearchablePageEmptyState icon={icon} title={title} description={description} />;
};
