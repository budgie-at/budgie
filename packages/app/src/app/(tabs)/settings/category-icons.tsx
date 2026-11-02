import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { MenuSpacer } from '../../../@generic/component/menu-spacer/menu-spacer';
import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { SearchablePageErrorState } from '../../../@generic/component/searchable-page-error-state/searchable-page-error-state';
import { useIconSearchCatalog } from '../../../@generic/hook/use-icon-search-catalog.hook';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryIconFixRow } from '../../../category/components/category-icon-fix-row/category-icon-fix-row';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { needsIconChoice } from '../../../category/utils/needs-icon-choice.util';

import { CategoryIconsPageSelector } from './category-icons-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings/categories');

export default function CategoryIconsPage() {
    const { t } = useLingui();
    const { categories, isLoading, isFailure, retry } = useSearchCategoriesQuery('', false);
    const [hadCategoriesToFix, setHadCategoriesToFix] = useState(false);
    const catalog = useIconSearchCatalog();

    const categoriesWithDefaultIcon = (categories ?? []).filter(category => needsIconChoice(category, catalog.entries));
    const isRead = !isLoading && !catalog.isLoading && !isFailure && !catalog.isFailure;
    const isAllFixed = isRead && hadCategoriesToFix && isEmptyArray(categoriesWithDefaultIcon);

    if (isRead && isNotEmptyArray(categoriesWithDefaultIcon) && !hadCategoriesToFix) {
        setHadCategoriesToFix(true);
    }

    useEffect(() => {
        if (isAllFixed) {
            handleGoBack();
        }
    }, [isAllFixed]);

    const doneState = isAllFixed ? null : (
        <LoadingContent isLoading={!isRead}>
            <SearchablePageEmptyState
                icon={UserIconNameEnum.Sparkles}
                title={t`All categories have icons`}
                description={t`New categories get an icon from their name automatically.`}
            />
        </LoadingContent>
    );
    const handleRetry = () => {
        retry();
        catalog.retry();
    };
    const fallback = isFailure || catalog.isFailure ? <SearchablePageErrorState onRetry={handleRetry} /> : doneState;

    return (
        <GroupedSurface>
            <CollapsibleChromePage
                scrimClassName="bg-surface"
                title={t`Category icons`}
                leading={<GoBackButton onPress={handleGoBack} />}
                testID={CategoryIconsPageSelector.Container}
            >
                {isNotEmptyArray(categoriesWithDefaultIcon) ? (
                    <View className="gap-y-7xl">
                        {categoriesWithDefaultIcon.map((category, index) => {
                            const footer = index === 0 ? t`Tap a suggestion to use it for that category.` : void 0;

                            return <CategoryIconFixRow key={category.id} category={category} footer={footer} />;
                        })}
                        <MenuSpacer />
                    </View>
                ) : (
                    fallback
                )}
            </CollapsibleChromePage>
        </GroupedSurface>
    );
}
