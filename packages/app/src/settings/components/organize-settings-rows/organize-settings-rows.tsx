import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';

import { isPositiveNumber } from '@rnw-community/shared';

import { SettingsPageSelector } from '../../../app/(tabs)/settings/settings-page.selector';
import { useNonSystemCategoriesQuery } from '../../../category/query/use-non-system-categories.query';
import { useGetAllRulesQuery } from '../../../rule/query/use-get-all-rules.query';
import { useSearchTagsQuery } from '../../../tag/query/use-search-tags.query';
import { SettingsRowAccessory } from '../settings-row-accessory/settings-row-accessory';
import { SettingsRow } from '../settings-row/settings-row';

const handleNavigateToCategories = () => void router.push('/settings/categories');
const handleNavigateToTags = () => void router.push('/settings/tags');
const handleNavigateToRules = () => void router.push('/settings/rules');

export const OrganizeSettingsRows = () => {
    const { t } = useLingui();
    const { categories } = useNonSystemCategoriesQuery();
    const { tags } = useSearchTagsQuery();
    const { rules } = useGetAllRulesQuery();

    const categoryCount = isPositiveNumber(categories.length) ? String(categories.length) : '';
    const tagCount = isPositiveNumber(tags?.length) ? String(tags.length) : '';
    const ruleCount = isPositiveNumber(rules?.length) ? String(rules.length) : '';

    return (
        <>
            <SettingsRow
                onPress={handleNavigateToCategories}
                title={t`Categories`}
                icon={UserIconNameEnum.Folder}
                variant="ghost"
                right={<SettingsRowAccessory value={categoryCount} />}
                testID={SettingsPageSelector.ManageCategoriesCard}
            />
            <SettingsRow
                onPress={handleNavigateToTags}
                title={t`Tags`}
                icon={UserIconNameEnum.Tag}
                variant="ghost"
                right={<SettingsRowAccessory value={tagCount} />}
                testID={SettingsPageSelector.ManageTagsCard}
            />
            <SettingsRow
                onPress={handleNavigateToRules}
                title={t`Rules`}
                icon={UserIconNameEnum.Zap}
                variant="ghost"
                right={<SettingsRowAccessory value={ruleCount} />}
                testID={SettingsPageSelector.ManageRulesCard}
            />
        </>
    );
};
