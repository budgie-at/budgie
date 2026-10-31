import { useLingui } from '@lingui/react/macro';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { CategoryDefaultIconButton } from '../category-default-icon-button/category-default-icon-button';

import type { ReactNode } from 'react';

interface Props {
    readonly children: ReactNode;
}

export const CategoryListHeader = ({ children }: Props) => {
    const { t } = useLingui();

    return (
        <>
            <CategoryDefaultIconButton />
            {children}
            <GroupedListSectionTitle title={t`Custom categories`} />
        </>
    );
};
