import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { confirmAlert } from '../../../@generic/utils/confirm-alert/confirm-alert.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';

import { CategorizeInboxHeroSelector } from './categorize-inbox-hero.selector';

import type { CategorizeInboxAssignmentInterface } from '../../interface/categorize-inbox-assignment.interface';

interface Props {
    readonly assignments: CategorizeInboxAssignmentInterface[];
}

const SUMMARY_CATEGORY_LIMIT = 5;

export const CategorizeInboxHero = ({ assignments }: Props) => {
    const { t } = useLingui();
    const { categoriesById, excludedTransactionIds, isBusy, assign } = useCategorizeInboxContext();

    const includedAssignments = assignments
        .map(assignment => ({
            ...assignment,
            transactionIds: assignment.transactionIds.filter(transactionId => !excludedTransactionIds.has(transactionId))
        }))
        .filter(assignment => isNotEmptyArray(assignment.transactionIds));
    const rowCount = includedAssignments.reduce((total, assignment) => total + assignment.transactionIds.length, 0);

    const handleAcceptAll = async (): Promise<void> => {
        const rowCountByCategoryId = new Map<number, number>();

        for (const assignment of includedAssignments) {
            rowCountByCategoryId.set(
                assignment.categoryId,
                (rowCountByCategoryId.get(assignment.categoryId) ?? 0) + assignment.transactionIds.length
            );
        }

        const sortedEntries = [...rowCountByCategoryId].sort(([, firstCount], [, secondCount]) => secondCount - firstCount);
        const hiddenCategoryCount = sortedEntries.length - SUMMARY_CATEGORY_LIMIT;
        const summaryLines = sortedEntries
            .slice(0, SUMMARY_CATEGORY_LIMIT)
            .map(([categoryId, count]) => `${categoriesById.get(categoryId)?.title ?? t`Uncategorized`} — ${count}`);
        const moreLines = isPositiveNumber(hiddenCategoryCount)
            ? [t({ message: plural(hiddenCategoryCount, { one: '+# more category', other: '+# more categories' }) })]
            : [];

        const isConfirmed = await confirmAlert({
            title: t({ message: plural(rowCount, { one: 'Accept # suggestion?', other: 'Accept # suggestions?' }) }),
            message: [...summaryLines, ...moreLines].join('\n'),
            confirmText: t`Accept`,
            cancelText: t`Cancel`
        });

        if (isConfirmed) {
            assign(includedAssignments);
        }
    };

    const handleAcceptAllPress = (): void => void handleAcceptAll();

    const readyText = t({ message: plural(rowCount, { one: '# transaction ready', other: '# transactions ready' }) });
    const merchantsText = t({ message: plural(includedAssignments.length, { one: 'across # merchant', other: 'across # merchants' }) });

    if (!isPositiveNumber(rowCount)) {
        return null;
    }

    return (
        <Card size="md" variant="positive" className="mb-md flex-row items-center gap-x-lg" testID={CategorizeInboxHeroSelector.Card}>
            <CircleIcon
                icon={UserIconNameEnum.Sparkles}
                variant="primary"
                size={40}
                iconSize={20}
                border={false}
                iconClassName="text-positive-foreground"
            />

            <View className="flex-1 gap-y-xxs">
                <Text className="text-primary text-md font-semibold" numberOfLines={1}>
                    {readyText}
                </Text>
                <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                    {merchantsText}
                </Text>
            </View>

            <Button
                content={t`Accept all`}
                variant="cta"
                size="sm"
                onPress={handleAcceptAllPress}
                disabled={isBusy}
                testID={CategorizeInboxHeroSelector.AcceptAllButton}
            />
        </Card>
    );
};
