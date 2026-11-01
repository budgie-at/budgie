import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { isEmptyArray, isNotEmptyArray } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
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
    const isPending = isLoading || catalog.isLoading;
    const isRead = !isPending && !isFailure && !catalog.isFailure;
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
        <LoadingContent isLoading={isPending}>
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
    const fallback = isPending || isRead ? doneState : <SearchablePageErrorState onRetry={handleRetry} />;

    return (
        <CollapsibleChromePage
            title={t`Category Icons`}
            leading={<GoBackButton onPress={handleGoBack} />}
            testID={CategoryIconsPageSelector.Container}
        >
            {isNotEmptyArray(categoriesWithDefaultIcon) ? (
                <View className="gap-y-3xl">
                    <Text className="text-secondary-foreground px-3xl text-[13px] leading-[18px]">
                        {t({
                            message: plural(categoriesWithDefaultIcon.length, {
                                one: 'This category still uses the default icon. Tap a suggestion to set it.',
                                other: 'These categories still use the default icon. Tap a suggestion to set one.'
                            })
                        })}
                    </Text>
                    {categoriesWithDefaultIcon.map(category => (
                        <CategoryIconFixRow key={category.id} category={category} />
                    ))}
                </View>
            ) : (
                fallback
            )}
        </CollapsibleChromePage>
    );
}
