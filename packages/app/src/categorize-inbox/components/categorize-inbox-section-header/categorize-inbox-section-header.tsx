import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { StickySectionHeaderBackdrop } from '../../../@generic/component/sticky-section-header-backdrop/sticky-section-header-backdrop';
import { testID } from '../../../@generic/utils/test-id.util';

import { CategorizeInboxSectionHeaderSelector } from './categorize-inbox-section-header.selector';

interface Props {
    readonly section: CategorizeInboxSectionEnum;
    readonly rowCount: number;
}

export const CategorizeInboxSectionHeader = ({ section, rowCount }: Props) => {
    const { t } = useLingui();

    const sectionTitles: Record<CategorizeInboxSectionEnum, string> = {
        [CategorizeInboxSectionEnum.CASH_WITHDRAWALS]: t`Cash withdrawals`,
        [CategorizeInboxSectionEnum.CONFIDENT]: t`Ready to file`,
        [CategorizeInboxSectionEnum.REVIEW]: t`Your call`,
        [CategorizeInboxSectionEnum.ONE_OFFS]: t`Smaller groups`
    };
    const trailing =
        section === CategorizeInboxSectionEnum.REVIEW ? (
            <Text className="text-xs text-secondary-foreground">
                <Trans>Largest first</Trans>
            </Text>
        ) : null;

    return (
        <View
            className="flex-row items-baseline justify-between gap-x-md pb-sm pt-4xl"
            accessibilityRole="header"
            {...testID(CategorizeInboxSectionHeaderSelector.Header, section)}
        >
            <StickySectionHeaderBackdrop />
            <Text className="shrink text-md font-semibold text-primary" numberOfLines={1}>
                {sectionTitles[section]}
                <Text className="font-normal text-secondary-foreground tabular-nums">{` ${rowCount}`}</Text>
            </Text>
            {trailing}
        </View>
    );
};
