import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { ScreenChromeFrame } from '@rnw-community/react-native-screen-chrome';

import { CollapsibleChromeHeader } from '../../../@generic/component/collapsible-chrome-header/collapsible-chrome-header';
import { CollapsibleHeaderBackdrop } from '../../../@generic/component/collapsible-header-backdrop/collapsible-header-backdrop';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { ScreenChromeThemeProvider } from '../../../@generic/provider/screen-chrome-theme.provider';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { CategoryIconsList } from '../../../category/components/category-icons-list/category-icons-list';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';

import { CategoryIconsPageSelector } from './category-icons-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings/categories');

export default function CategoryIconsPage() {
    const { t } = useLingui();
    const { categories, isLoading } = useNonSystemCategoriesQuery();

    const listEmptyComponent = isLoading ? null : (
        <EmptyState icon={UserIconNameEnum.Sparkles} title={t`All categories have icons`} description={t`Nothing to fix here`} />
    );
    const largeTitle = (
        <Text className="text-primary font-medium text-3xl" numberOfLines={1}>
            {t`Category Icons`}
        </Text>
    );
    const smallTitle = (
        <Text className="text-primary text-lg font-semibold text-center" numberOfLines={1}>
            {t`Category Icons`}
        </Text>
    );

    return (
        <ScreenChromeThemeProvider syncNativeScrollOffset>
            <ScreenChromeFrame>
                <View className="flex-1 px-5xl" testID={CategoryIconsPageSelector.Container}>
                    <CategoryIconsList categories={categories} emptyState={listEmptyComponent} />
                </View>

                <CollapsibleHeaderBackdrop />

                <CollapsibleChromeHeader
                    leading={<GoBackButton onPress={handleGoBack} />}
                    expandedTitle={largeTitle}
                    collapsedTitle={smallTitle}
                />
            </ScreenChromeFrame>
        </ScreenChromeThemeProvider>
    );
}
