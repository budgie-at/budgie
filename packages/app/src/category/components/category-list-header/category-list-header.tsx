import { useLingui } from '@lingui/react/macro';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { CategoryDefaultIconButton } from '../category-default-icon-button/category-default-icon-button';

export const CategoryListHeader = () => {
    const { t } = useLingui();

    return (
        <>
            <CategoryDefaultIconButton />
            <GroupedListSectionTitle title={t`Custom categories`} />
        </>
    );
};
