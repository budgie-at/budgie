import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenChromeFooter } from '@rnw-community/react-native-screen-chrome';
import { isDefined } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxCluster } from '../../hook/use-categorize-inbox-cluster.hook';
import { formatCategorizeInboxMerchantTitle } from '../../utils/format-categorize-inbox-merchant-title.util';
import { groupCategorizeInboxRowsByMonth } from '../../utils/group-categorize-inbox-rows-by-month.util';
import { CategorizeInboxPaymentsMonth } from '../categorize-inbox-payments-month/categorize-inbox-payments-month';
import { CategorizeInboxPaymentsSummary } from '../categorize-inbox-payments-summary/categorize-inbox-payments-summary';
import { CategorizeInboxScreenChrome } from '../categorize-inbox-screen-chrome/categorize-inbox-screen-chrome';
import { CategorizeInboxScreenScroll } from '../categorize-inbox-screen-scroll/categorize-inbox-screen-scroll';
import { CategorizeInboxScreenTitle } from '../categorize-inbox-screen-title/categorize-inbox-screen-title';

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
        <CategorizeInboxScreenChrome>
            <CategorizeInboxScreenScroll>
                <CategorizeInboxScreenTitle title={t`Choose payments`}>
                    <Text className="text-secondary-foreground text-sm" numberOfLines={1}>
                        {formatCategorizeInboxMerchantTitle(cluster.displayTitle)}
                    </Text>
                    <CategorizeInboxPaymentsSummary cluster={cluster} />
                </CategorizeInboxScreenTitle>

                {groupCategorizeInboxRowsByMonth(cluster.rows).map((group, index) => {
                    const monthClassName = index === 0 ? '' : 'border-t-hairline border-secondary-corner';

                    return (
                        <CategorizeInboxPaymentsMonth
                            key={group.month.getTime()}
                            group={group}
                            displayTitle={cluster.displayTitle}
                            className={monthClassName}
                        />
                    );
                })}
            </CategorizeInboxScreenScroll>

            <ScreenChromeFooter includeBottomSafeArea={false} edgeFadeProps={HIDDEN_EDGE_FADE_PROPS}>
                <View className="border-t-hairline border-secondary-corner bg-primary-reverse px-3xl pb-safe pt-md">
                    <Button
                        variant="cta"
                        size="md"
                        content={doneContent}
                        onPress={handleDone}
                        testID={CategorizeInboxPaymentsScreenSelector.DoneButton}
                    />
                </View>
            </ScreenChromeFooter>
        </CategorizeInboxScreenChrome>
    );
};
