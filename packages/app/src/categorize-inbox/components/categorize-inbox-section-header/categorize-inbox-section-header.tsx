import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { CATEGORIZE_INBOX_SECTION_ACCENT } from '../../constant/categorize-inbox-section-accent.constant';
import { CategorizeInboxSectionTitle } from '../categorize-inbox-section-title/categorize-inbox-section-title';

import { CategorizeInboxSectionHeaderSelector } from './categorize-inbox-section-header.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly rowCount: number;
    readonly totalBaseAmount: number | null;
}

export const CategorizeInboxSectionHeader = ({ section, rowCount, totalBaseAmount }: Props) => {
    const protectAmount = useProtectedAmountLabel();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);

    const summaryText = isDefined(totalBaseAmount)
        ? `${rowCount} · ${protectAmount(convertFromMicroUnits(totalBaseAmount), defaultInstrument.symbol)}`
        : String(rowCount);

    return (
        <View
            className="flex-row items-center justify-between gap-x-md py-md"
            accessibilityRole="header"
            {...testID(CategorizeInboxSectionHeaderSelector.Header, section)}
        >
            <StickySectionHeaderBackdrop />
            <View className="shrink flex-row items-center gap-x-md">
                <View className={cn('h-2 w-2 rounded-full', CATEGORIZE_INBOX_SECTION_ACCENT[section])} />
                <CategorizeInboxSectionTitle
                    section={section}
                    className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest"
                />
            </View>
            <Text className="text-secondary-foreground text-xs tabular-nums" numberOfLines={1}>
                {summaryText}
            </Text>
        </View>
    );
};
