import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';
import { Pressable, Text } from 'react-native';

import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';

const RETRY_HIT_SLOP = 12;

export const YieldLegendRetry = () => {
    const { screenKey } = use(YieldScreenContext);
    const summaryAtom = yieldSummaryFamily(screenKey.key);
    const result = useLiveAtomValue(summaryAtom);
    const refresh = useAtomRefresh(summaryAtom);

    return (
        <LoadingContent isLoading={AsyncResult.isWaiting(result)}>
            <Pressable accessibilityRole="button" onPress={refresh} hitSlop={RETRY_HIT_SLOP}>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Not updated · Retry</Trans>
                </Text>
            </Pressable>
        </LoadingContent>
    );
};
