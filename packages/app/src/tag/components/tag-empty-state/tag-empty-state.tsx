import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';

interface Props {
    readonly search: string;
}

export const TagEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    const isSearching = isNotEmptyString(search);
    const icon = isSearching ? UserIconNameEnum.Search : UserIconNameEnum.Tag;
    const title = isSearching ? t`No Results` : t`No Tags Yet`;
    const description = isSearching ? t`No tags match your search` : t`Create tags to organize your transactions`;

    return <SearchablePageEmptyState icon={icon} title={title} description={description} />;
};
