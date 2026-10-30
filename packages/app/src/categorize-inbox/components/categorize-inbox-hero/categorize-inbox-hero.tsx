import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxSectionChip } from '../categorize-inbox-section-chip/categorize-inbox-section-chip';

interface Props {
    readonly activeSection: CategorizeInboxSectionEnum | null;
    readonly onSectionPress: (section: CategorizeInboxSectionEnum) => void;
}

const CHIP_SECTIONS = [
    CategorizeInboxSectionEnum.CONFIDENT,
    CategorizeInboxSectionEnum.CASH_WITHDRAWALS,
    CategorizeInboxSectionEnum.REVIEW,
    CategorizeInboxSectionEnum.ONE_OFFS
] as const;

export const CategorizeInboxHero = ({ activeSection, onSectionPress }: Props) => {
    const { t } = useLingui();
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { items, remainingCount } = useCategorizeInboxContext();

    const worthAmount = getCategorizeInboxDefaultAmount(
        items.filter(isCategorizeInboxCluster).flatMap(cluster => cluster.rows),
        defaultInstrument
    );
    const countText = t({ message: plural(remainingCount, { one: 'payment to sort', other: 'payments to sort' }) });
    const subtitle = isDefined(worthAmount) ? `${countText} · ${amountLabel(worthAmount, defaultInstrument.symbol)}` : countText;

    const headers = items.flatMap(item => (isCategorizeInboxCluster(item) ? [] : [item]));
    const chips = CHIP_SECTIONS.map(section => ({
        section,
        count: headers.find(header => header.section === section)?.count ?? 0
    })).filter(({ count }) => isPositiveNumber(count));

    return (
        <View className="gap-y-xl pb-3xl">
            <View className="items-center">
                <Text className="text-[40px] leading-[48px] font-semibold tracking-[-0.8px] text-primary tabular-nums" numberOfLines={1}>
                    {remainingCount}
                </Text>
                <Text className="text-sm text-center text-secondary-foreground tabular-nums" numberOfLines={1}>
                    {subtitle}
                </Text>
            </View>

            <ScrollView
                horizontal
                className="-mx-5xl"
                contentContainerClassName="grow justify-center gap-x-sm px-5xl"
                showsHorizontalScrollIndicator={false}
            >
                {chips.map(({ section, count }) => (
                    <CategorizeInboxSectionChip
                        key={section}
                        section={section}
                        count={count}
                        isActive={section === activeSection}
                        onPress={onSectionPress}
                    />
                ))}
            </ScrollView>
        </View>
    );
};
