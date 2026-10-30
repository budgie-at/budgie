import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { CATEGORIZE_INBOX_SECTION_COLOR } from '../../constant/categorize-inbox-section-dot.constant';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { isCategorizeInboxCluster } from '../../type-guard/is-categorize-inbox-cluster.type-guard';
import { getCategorizeInboxDefaultAmount } from '../../utils/get-categorize-inbox-default-amount.util';
import { CategorizeInboxDot } from '../categorize-inbox-dot/categorize-inbox-dot';

import { CategorizeInboxSectionHeaderSelector } from './categorize-inbox-section-header.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly rowCount: number;
}

export const CategorizeInboxSectionHeader = ({ section, rowCount }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
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
    const totalText = isDefined(totalAmount) ? protectAmount(convertFromMicroUnits(totalAmount), defaultInstrument.symbol) : '';

    return (
        <View
            className="flex-row items-center justify-between gap-x-md pb-md pt-3xl"
            accessibilityRole="header"
            {...testID(CategorizeInboxSectionHeaderSelector.Header, section)}
        >
            <View className="shrink flex-row items-center gap-x-sm">
                <CategorizeInboxDot className={CATEGORIZE_INBOX_SECTION_COLOR[section]} />
                <Text className="shrink text-sm font-semibold text-primary" numberOfLines={1}>
                    {`${sectionTitles[section]} `}
                    <Text className="font-normal text-secondary-foreground tabular-nums">{rowCount}</Text>
                </Text>
            </View>
            <Text className="text-sm text-secondary-foreground tabular-nums" numberOfLines={1}>
                {totalText}
            </Text>
        </View>
    );
};
