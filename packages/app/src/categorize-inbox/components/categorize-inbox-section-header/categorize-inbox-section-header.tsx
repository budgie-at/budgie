import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxAmountLabel } from '../../hook/use-categorize-inbox-amount-label.hook';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';

import { CategorizeInboxSectionHeaderSelector } from './categorize-inbox-section-header.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly rowCount: number;
}

export const CategorizeInboxSectionHeader = ({ section, rowCount }: Props) => {
    const { t } = useLingui();
    const amountLabel = useCategorizeInboxAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { items } = useCategorizeInboxContext();

    const sectionTitles: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: t`Cash withdrawals`,
        [CategorizeInboxSectionEnum.CONFIDENT]: t`Ready to file`,
        [CategorizeInboxSectionEnum.REVIEW]: t`Your call`,
        [CategorizeInboxSectionEnum.ONE_OFFS]: t`Smaller groups`
    };
    const totalAmount = getCategorizeInboxDefaultAmount(
        items
            .filter(isCategorizeInboxCluster)
            .filter(cluster => cluster.section === section)
            .flatMap(cluster => cluster.rows),
        defaultInstrument
    );
    const totalText = isDefined(totalAmount) ? amountLabel(totalAmount, defaultInstrument.symbol) : '';

    return (
        <View
            className="h-[32px] flex-row items-center justify-between gap-x-md px-3xl"
            accessibilityRole="header"
            {...testID(CategorizeInboxSectionHeaderSelector.Header, section)}
        >
            <Text className="shrink text-[13px] leading-[16px] font-semibold text-primary" numberOfLines={1}>
                {`${sectionTitles[section]} `}
                <Text className="font-normal text-secondary-foreground tabular-nums">{rowCount}</Text>
            </Text>
            <Text className="shrink-0 text-[13px] leading-[16px] text-secondary-foreground tabular-nums" numberOfLines={1}>
                {totalText}
            </Text>
        </View>
    );
};
