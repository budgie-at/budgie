import { CategoryEntityInterface, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { AccessibilityInfo } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconSuggestions } from '../../../@generic/component/icon-suggestions/icon-suggestions';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { showSuccessToast } from '../../../@generic/utils/show-success-toast/show-success-toast';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { PLACEHOLDER_CATEGORY_ICON } from '../../constant/placeholder-category-icon.constant';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';

import { CategoryIconFixRowSelector } from './category-icon-fix-row.selector';

interface Props {
    readonly category: CategoryEntityInterface;
}

export const CategoryIconFixRow = ({ category }: Props) => {
    const { t } = useLingui();
    const [openIconSelector] = useIconSelectorModal();
    const iconTerms = getCategoryIconTerms(category);

    const { run, isLoading } = useSingleFlight();
    const categoryTitle = category.title;

    const handleSelect = (icon: UserIconType) =>
        void run(
            Effect.flatMap(CategoryService, categoryService => categoryService.updateIcon(category.id, icon)).pipe(
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

        openIconSelector({ selectedIcon: category.icon, keywords: iconTerms }, selectedIcon => {
            if (isDefined(selectedIcon)) {
                handleSelect(selectedIcon);
            }
        });
    };

    return (
        <GroupedListSection>
            <GroupedListRow
                testID={CategoryIconFixRowSelector.Row(category.title)}
                left={
                    <CircleIcon
                        icon={PLACEHOLDER_CATEGORY_ICON}
                        variant="secondary"
                        size={36}
                        iconSize={18}
                        radius={18}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.secondary}
                    />
                }
                title={category.title}
            />
            <LoadingContent isLoading={isLoading} className="px-3xl pb-lg pt-xs">
                <IconSuggestions
                    terms={iconTerms}
                    limit={6}
                    onSelect={handleSelect}
                    testID={CategoryIconFixRowSelector.Suggestions(category.title)}
                />
            </LoadingContent>
            <GroupedListRow
                testID={CategoryIconFixRowSelector.ChooseAnother(category.title)}
                left={<CircleIcon icon={UserIconNameEnum.Ellipsis} variant="ghost" size={36} iconSize={18} radius={18} border={false} />}
                title={t`Choose another icon…`}
                onPress={handleOpenIconSelector}
            />
        </GroupedListSection>
    );
};
