import { DEFAULT_CATEGORY_ICON, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryIconFixRow } from '../../../category/components/category-icon-fix-row/category-icon-fix-row';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';

import { CategoryIconsPageSelector } from './category-icons-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings/categories');

export default function CategoryIconsPage() {
    const { t } = useLingui();
    const { categories, isLoading } = useNonSystemCategoriesQuery();

    const categoriesWithDefaultIcon = categories.filter(category => category.icon === DEFAULT_CATEGORY_ICON);
    const emptyState = isLoading ? null : (
        <EmptyState icon={UserIconNameEnum.Sparkles} title={t`All categories have icons`} description={t`Nothing to fix here`} />
    );

    return (
        <CollapsibleChromePage
            title={t`Category Icons`}
            leading={<GoBackButton onPress={handleGoBack} />}
            testID={CategoryIconsPageSelector.Container}
        >
            {isNotEmptyArray(categoriesWithDefaultIcon)
                ? categoriesWithDefaultIcon.map(category => <CategoryIconFixRow key={category.id} category={category} />)
                : emptyState}
        </CollapsibleChromePage>
    );
}
