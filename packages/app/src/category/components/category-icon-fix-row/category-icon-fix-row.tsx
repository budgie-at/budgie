import { CategoryEntityInterface, UserIconType } from '@budgie/contracts';
import { CategoryService } from '@budgie/ledger';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { IconSuggestions } from '../../../@generic/component/icon-suggestions/icon-suggestions';
import { TONAL_DISC_BACKGROUND } from '../../../@generic/constant/tonal-disc-background.constant';
import { useIconSelectorModal } from '../../../@generic/context/icon-selector-modal.context';
import { appRuntime } from '../../../@generic/runtime/app.runtime';
import { logAndContinue } from '../../../@generic/utils/log-and-continue.util';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { getCategoryIconTerms } from '../../utils/get-category-icon-terms.util';

import { CategoryIconFixRowSelector } from './category-icon-fix-row.selector';

interface Props {
    readonly category: CategoryEntityInterface;
}

export const CategoryIconFixRow = ({ category }: Props) => {
    const { t } = useLingui();
    const [openIconSelector] = useIconSelectorModal();
    const iconTerms = getCategoryIconTerms(category);

    const handleSelect = (icon: UserIconType) => {
        appRuntime.runFork(
            logAndContinue(
                Effect.flatMap(CategoryService, categoryService => categoryService.updateIcon(category.id, icon)).pipe(
                    toastOnFailure(t`Could not update category icon`, t`Please try again later`)
                )
            )
        );
    };

    const handleOpenIconSelector = () => {
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
                        icon={category.icon}
                        variant="default"
                        size={36}
                        iconSize={18}
                        radius={18}
                        border={false}
                        className={TONAL_DISC_BACKGROUND.default}
                    />
                }
                title={category.title}
                subtitle={t`More icons`}
                onPress={handleOpenIconSelector}
            />
            <View className="px-3xl pb-xl pt-xs">
                <IconSuggestions
                    terms={iconTerms}
                    limit={6}
                    onSelect={handleSelect}
                    testID={CategoryIconFixRowSelector.Suggestions(category.title)}
                />
            </View>
        </GroupedListSection>
    );
};
