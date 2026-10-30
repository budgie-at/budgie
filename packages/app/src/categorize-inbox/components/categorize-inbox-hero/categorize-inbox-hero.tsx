import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxHeroCount } from '../categorize-inbox-hero-count/categorize-inbox-hero-count';

const SPLIT_SECTIONS = [
    { section: CategorizeInboxSectionEnum.CONFIDENT, dotClassName: 'bg-positive-action' },
    { section: CategorizeInboxSectionEnum.CASH_WITHDRAWALS, dotClassName: 'bg-attention-foreground' },
    { section: CategorizeInboxSectionEnum.REVIEW, dotClassName: 'bg-secondary-foreground' },
    { section: CategorizeInboxSectionEnum.ONE_OFFS, dotClassName: 'bg-secondary-foreground/40' }
] as const;

export const CategorizeInboxHero = () => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { items, remainingCount } = useCategorizeInboxContext();

    const worthAmount = getCategorizeInboxDefaultAmount(
        items.filter(isCategorizeInboxCluster).flatMap(cluster => cluster.rows),
        defaultInstrument
    );
    const worthText = isDefined(worthAmount) ? protectAmount(convertFromMicroUnits(worthAmount), defaultInstrument.symbol) : '';
    const countText = t({ message: plural(remainingCount, { one: 'payment to sort', other: 'payments to sort' }) });
    const subtitle = isDefined(worthAmount) ? `${countText} · ${worthText}` : countText;

    const sectionTexts: Record<CategorizeInboxSectionEnum, (count: number) => string> = {
        [CategorizeInboxSectionEnum.CONFIDENT]: count => t({ message: plural(count, { one: '# ready', other: '# ready' }) }),
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: count => t({ message: plural(count, { one: '# cash', other: '# cash' }) }),
        [CategorizeInboxSectionEnum.REVIEW]: count => t({ message: plural(count, { one: '# your call', other: '# your call' }) }),
        [CategorizeInboxSectionEnum.ONE_OFFS]: count => t({ message: plural(count, { one: '# other', other: '# other' }) })
    };
    const headers = items.flatMap(item => (isCategorizeInboxCluster(item) ? [] : [item]));
    const splits = SPLIT_SECTIONS.map(({ section, dotClassName }) => ({
        section,
        dotClassName,
        count: headers.find(header => header.section === section)?.count ?? 0
    })).filter(({ count }) => isPositiveNumber(count));

    return (
        <View className="items-center gap-y-md pb-3xl pt-xs">
            <View className="items-center gap-y-xxs">
                <Text className="text-[48px] leading-[56px] font-semibold tracking-[-1px] text-primary tabular-nums" numberOfLines={1}>
                    {remainingCount}
                </Text>
                <Text className="text-sm text-center text-secondary-foreground tabular-nums" numberOfLines={1}>
                    {subtitle}
                </Text>
            </View>

            <View className="flex-row flex-wrap justify-center gap-x-xl gap-y-xs px-3xl">
                {splits.map(({ section, dotClassName, count }) => (
                    <CategorizeInboxHeroCount key={section} dotClassName={dotClassName} text={sectionTexts[section](count)} />
                ))}
            </View>
        </View>
    );
};
