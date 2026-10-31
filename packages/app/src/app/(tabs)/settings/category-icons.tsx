import { DEFAULT_CATEGORY_ICON, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SearchablePageErrorState } from '../../../@generic/component/searchable-page-error-state/searchable-page-error-state';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryIconFixRow } from '../../../category/components/category-icon-fix-row/category-icon-fix-row';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';

import { CategoryIconsPageSelector } from './category-icons-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings/categories');

export default function CategoryIconsPage() {
    const { t } = useLingui();
    const { categories, isLoading, isFailure, retry } = useSearchCategoriesQuery('', false);
    const [hadCategoriesToFix, setHadCategoriesToFix] = useState(false);

    const categoriesWithDefaultIcon = (categories ?? []).filter(category => category.icon === DEFAULT_CATEGORY_ICON);
    const isRead = !isLoading && !isFailure;
    const isAllFixed = isRead && hadCategoriesToFix && isEmptyArray(categoriesWithDefaultIcon);

    if (isRead && isNotEmptyArray(categoriesWithDefaultIcon) && !hadCategoriesToFix) {
        setHadCategoriesToFix(true);
    }

    useEffect(() => {
        if (isAllFixed) {
            handleGoBack();
        }
    }, [isAllFixed]);

    const doneState =
        isRead && !isAllFixed ? (
            <SearchablePageEmptyState
                icon={UserIconNameEnum.Sparkles}
                title={t`All categories have icons`}
                description={t`New categories get an icon from their name automatically.`}
            />
        ) : null;
    const fallback = isFailure ? <SearchablePageErrorState onRetry={retry} /> : doneState;

    return (
        <CollapsibleChromePage
            title={t`Category Icons`}
            leading={<GoBackButton onPress={handleGoBack} />}
            testID={CategoryIconsPageSelector.Container}
        >
            {isNotEmptyArray(categoriesWithDefaultIcon) ? (
                <View className="gap-y-3xl">
                    {categoriesWithDefaultIcon.map((category, index) => (
                        <CategoryIconFixRow
                            key={category.id}
                            category={category}
                            {...(index === 0 && { footer: t`Pick an icon — it saves instantly.` })}
                        />
                    ))}
                </View>
            ) : (
                fallback
            )}
        </CollapsibleChromePage>
    );
}
