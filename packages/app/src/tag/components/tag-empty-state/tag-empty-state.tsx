import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageEmptyState } from '../../../@generic/component/searchagle-page-empty-state/searchagle-page-empty-state';
import { TagsSettingsFeatureIntro } from '../tags-settings-feature-intro/tags-settings-feature-intro';

interface Props {
    readonly search: string;
}

export const TagEmptyState = ({ search }: Props) => {
    const { t } = useLingui();

    if (isNotEmptyString(search)) {
        return <SearchablePageEmptyState icon={UserIconNameEnum.Search} title={t`No Results`} description={t`No tags match your search`} />;
    }

    return <TagsSettingsFeatureIntro />;
};
