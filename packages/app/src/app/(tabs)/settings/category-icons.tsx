import { CategoryEntityInterface, DEFAULT_CATEGORY_ICON, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { PageHeader } from '../../../@generic/component/page-header/page-header';
import { Page } from '../../../@generic/component/page/page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryIconFixRow } from '../../../category/components/category-icon-fix-row/category-icon-fix-row';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';

import { CategoryIconsPageSelector } from './category-icons-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings/categories');

const keyExtractor = (category: CategoryEntityInterface) => String(category.id);

const renderItem = ({ item }: { item: CategoryEntityInterface }) => <CategoryIconFixRow category={item} />;

export default function CategoryIconsPage() {
    const { t } = useLingui();
    const { categories, isLoading } = useNonSystemCategoriesQuery();

    const defaultIconCategories = categories.filter(category => category.icon === DEFAULT_CATEGORY_ICON);
    const listEmptyComponent = isLoading ? null : (
        <EmptyState icon={UserIconNameEnum.Sparkles} title={t`All categories have icons`} description={t`Nothing to fix here`} />
    );

    return (
        <Page testID={CategoryIconsPageSelector.Container} header={<PageHeader title={t`Category Icons`} onGoBack={handleGoBack} />}>
            <FlatList
                data={defaultIconCategories}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                ListEmptyComponent={listEmptyComponent}
                contentContainerClassName="pt-3xl pb-5xl"
                showsVerticalScrollIndicator={false}
            />
        </Page>
    );
}
