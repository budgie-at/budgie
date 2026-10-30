import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { getCategorizeInboxPile } from '../../utils/get-categorize-inbox-pile.util';
import { CategorizeInboxPileLegendItem } from '../categorize-inbox-pile-legend-item/categorize-inbox-pile-legend-item';

export const CategorizeInboxPileLegend = () => {
    const { t } = useLingui();
    const { items, remainingCount, categorizedCount } = useCategorizeInboxContext();

    const { segments } = getCategorizeInboxPile(items, remainingCount + categorizedCount);

    const sectionTexts: Record<CategorizeInboxSectionEnum, (count: number) => string> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: count => t({ message: plural(count, { one: '# ready', other: '# ready' }) }),
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: count => t({ message: plural(count, { one: '# cash', other: '# cash' }) }),
        [CategorizeInboxSectionEnum.REVIEW]: count => t({ message: plural(count, { one: '# your call', other: '# your call' }) }),
        [CategorizeInboxSectionEnum.ONE_OFFS]: count => t({ message: plural(count, { one: '# other', other: '# other' }) })
    };
    const sortedText = t({ message: plural(categorizedCount, { one: '# sorted', other: '# sorted' }) });

    return (
        <View className="flex-row flex-wrap gap-x-lg gap-y-xs">
            {segments
                .filter(({ count }) => isPositiveNumber(count))
                .map(({ section, className, count }) => {
                    const dotClassName = section === CategorizeInboxSectionEnum.ONE_OFFS ? 'border border-secondary-foreground' : className;

                    return <CategorizeInboxPileLegendItem key={section} dotClassName={dotClassName} text={sectionTexts[section](count)} />;
                })}
            {isPositiveNumber(categorizedCount) ? (
                <CategorizeInboxPileLegendItem dotClassName="border border-secondary-foreground bg-secondary-corner" text={sortedText} />
            ) : null}
        </View>
    );
};
