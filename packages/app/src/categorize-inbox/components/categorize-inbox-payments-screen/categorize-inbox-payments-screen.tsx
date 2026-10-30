import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { GroupedSurface } from '../../../@generic/component/grouped-surface/grouped-surface';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { groupCategorizeInboxRowsByMonth } from '../../utils/group-categorize-inbox-rows-by-month.util';
import { CategorizeInboxPaymentsMonth } from '../categorize-inbox-payments-month/categorize-inbox-payments-month';
import { CategorizeInboxPaymentsSummary } from '../categorize-inbox-payments-summary/categorize-inbox-payments-summary';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';

import { CategorizeInboxPaymentsScreenSelector } from './categorize-inbox-payments-screen.selector';

const HIDDEN_EDGE_FADE_PROPS = { style: { display: 'none' } } as const;

interface Props {
    readonly clusterKey: string;
}

export const CategorizeInboxPaymentsScreen = ({ clusterKey }: Props) => {
    const { t } = useLingui();
    const router = useRouter();
    const { includedRows } = useCategorizeInboxContext();
    const cluster = useCategorizeInboxCluster(clusterKey);

    if (!isDefined(cluster)) {
        return null;
    }

    const selectedCount = includedRows(cluster).length;
    const doneContent = t({ message: plural(selectedCount, { one: 'Done · # selected', other: 'Done · # selected' }) });

    const handleDone = (): void => void router.back();

    return (
        <GroupedSurface>
            <CategorizeInboxScreenChrome title={t`Choose payments`}>
                <CategorizeInboxScreenScroll>
                    <Text className="text-secondary-foreground px-3xl pb-xs pt-xs text-center text-[15px]" numberOfLines={1}>
                        {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                    </Text>
                    <CategorizeInboxPaymentsSummary cluster={cluster} />

                    {groupCategorizeInboxRowsByMonth(cluster.rows).map(group => (
                        <CategorizeInboxPaymentsMonth key={group.month.getTime()} group={group} displayTitle={cluster.displayTitle} />
                    ))}

                    <Text className="text-secondary-foreground px-3xl pt-xl text-center text-[13px]">
                        <Trans>Unchecked payments stay in your inbox.</Trans>
                    </Text>
                </CategorizeInboxScreenScroll>

                <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
                    <View className="border-t-hairline border-surface-separator bg-surface px-5xl pb-safe pt-lg">
                        <HapticPressable
                            onPress={handleDone}
                            className="h-[52px] items-center justify-center rounded-full bg-cta-background active:opacity-80"
                            accessibilityRole="button"
                            accessibilityLabel={doneContent}
                            testID={CategorizeInboxPaymentsScreenSelector.DoneButton}
                        >
                            <Text className="text-cta-foreground text-[17px] font-semibold">{doneContent}</Text>
                        </HapticPressable>
                    </View>
                </ScreenChromeFooter>
            </CategorizeInboxScreenChrome>
        </GroupedSurface>
    );
};
