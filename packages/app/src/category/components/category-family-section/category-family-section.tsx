import { HOUSEHOLD_SYNC_ZONE } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { GroupedListSectionTitle } from '../../../@generic/component/grouped-list-section-title/grouped-list-section-title';
import { useHousehold } from '../../../household/hook/use-household.hook';
import { useCategoriesWithUsageQuery } from '../../query/use-categories-with-usage.query';
import { CategoryCard } from '../category-card/category-card';

import type { EntityUsageInterface } from '../../../@generic/interface/entity-usage.interface';
import type { CategoryEntityInterface } from '@budgie/contracts';

interface Props {
    readonly search: string;
    readonly onOpen: (category: CategoryEntityInterface) => void;
}

const UNUSED: EntityUsageInterface = { transactionCount: 0, lastUsedAt: null };

export const CategoryFamilySection = ({ search, onOpen }: Props) => {
    const { t } = useLingui();
    const { isShared } = useHousehold();
    const { categories, usage } = useCategoriesWithUsageQuery(search, false, HOUSEHOLD_SYNC_ZONE);

    if (!isShared || !isNotEmptyArray(categories)) {
        return null;
    }

    return (
        <>
            <GroupedListSectionTitle title={t`Shared with family`} />
            {categories.map((category, index) => {
                const categoryUsage = isDefined(usage) ? (usage.find(entry => entry.id === category.id) ?? UNUSED) : void 0;

                return (
                    <CategoryCard
                        key={category.id}
                        onOpen={onOpen}
                        category={category}
                        usage={categoryUsage}
                        isFirst={index === 0}
                        isLast={index === categories.length - 1}
                    />
                );
            })}
        </>
    );
};
