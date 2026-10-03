import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useSettingsContext } from '../../../settings/context/settings.context';

import { CategorizeInboxSectionHeaderSelector } from './categorize-inbox-section-header.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly rowCount: number;
    readonly totalBaseAmount: number | null;
}

export const CategorizeInboxSectionHeader = ({ section, rowCount, totalBaseAmount }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { defaultInstrument } = useSettingsContext();

    const sectionTitles: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: t`Cash withdrawals`,
        [CategorizeInboxSectionEnum.CONFIDENT]: t`Ready to accept`,
        [CategorizeInboxSectionEnum.REVIEW]: t`Needs review`,
        [CategorizeInboxSectionEnum.ONE_OFFS]: t`One-offs`
    };
    const summaryText = isDefined(totalBaseAmount)
        ? `${rowCount} · ${protectAmount(convertFromMicroUnits(totalBaseAmount), defaultInstrument.symbol)}`
        : String(rowCount);

    return (
        <View
            className="flex-row items-center justify-between gap-x-md bg-primary-reverse py-sm"
            accessibilityRole="header"
            {...testID(CategorizeInboxSectionHeaderSelector.Header, section)}
        >
            <Text className="text-secondary-foreground uppercase text-xs" numberOfLines={1}>
                {sectionTitles[section]}
            </Text>
            <Text className="text-secondary-foreground text-xs" numberOfLines={1}>
                {summaryText}
            </Text>
        </View>
    );
};
