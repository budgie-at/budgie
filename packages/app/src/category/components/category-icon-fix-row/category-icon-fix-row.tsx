import { CategoryEntityInterface, CategoryIconSourceEnum, UserIconType } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { AccessibilityInfo, View } from 'react-native';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconSuggestions } from '../../../@generic/component/icon-suggestions/icon-suggestions';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showSuccessToast } from '../../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { PLACEHOLDER_CATEGORY_ICONS } from '../../constant/placeholder-category-icon.constant';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';

import { CategoryIconFixRowSelector } from './category-icon-fix-row.selector';

interface Props {
    readonly category: CategoryEntityInterface;
}

export const CategoryIconFixRow = ({ category }: Props) => {
    const { t } = useLingui();
    const [openIconSelector] = useIconSelectorModal();
    const iconTerms = getCategoryIconTerms(category);
    const primaryForeground = useCSSVariable('--color-primary');
    const suggestionVariables = { ...(isDefined(primaryForeground) && { '--color-secondary-foreground': primaryForeground }) };

    const { run, isLoading } = useSingleFlight();
    const categoryTitle = category.title;

    const handleSelect = (icon: UserIconType) =>
        void run(
            Effect.flatMap(CategoryService, categoryService =>
                categoryService.updateIcon(category.id, icon, CategoryIconSourceEnum.USER)
            ).pipe(
                Effect.andThen(
                    Effect.sync(() => {
                        const message = t`Icon updated for ${categoryTitle}`;
                        showSuccessToast(message);
                        AccessibilityInfo.announceForAccessibility(message);
                    })
                ),
                toastOnFailure(t`Could not update category icon`, t`Please try again later`)
            )
        );

    const handleOpenIconSelector = () => {
        if (isLoading) {
            return;
        }

        openIconSelector(
            { selectedIcon: category.icon, keywords: iconTerms, excludedIcons: PLACEHOLDER_CATEGORY_ICONS, variant: 'primary' },
            selectedIcon => {
                if (isDefined(selectedIcon)) {
                    handleSelect(selectedIcon);
                }
            }
        );
    };

    return (
        <GroupedListSection>
            <GroupedListRow title={category.title} left={<GroupedListIcon icon={category.icon} />} />
            <View testID={CategoryIconFixRowSelector.Row(category.title)}>
                <LoadingContent isLoading={isLoading} className="pl-[16px] py-lg">
                    <ScopedVariables variables={suggestionVariables}>
                        <IconSuggestions
                            terms={iconTerms}
                            limit={6}
                            edgeFadeClassName="from-grouped-surface-row/0 to-grouped-surface-row"
                            excludedIcons={PLACEHOLDER_CATEGORY_ICONS}
                            onSelect={handleSelect}
                            testID={CategoryIconFixRowSelector.Suggestions(category.title)}
                        />
                    </ScopedVariables>
                </LoadingContent>
            </View>
            <GroupedListRow
                testID={CategoryIconFixRowSelector.ChooseAnother(category.title)}
                title={t`Browse icons`}
                onPress={handleOpenIconSelector}
            />
        </GroupedListSection>
    );
};
