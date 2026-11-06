import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
import { ListRowDetail } from '../../../@generic/component/list-row-detail/list-row-detail';
import { ListRow } from '../../../@generic/component/list-row/list-row';
import { NeutralIconTile } from '../../../@generic/component/neutral-icon-tile/neutral-icon-tile';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { useFormatInzhurPendingTopUp } from '../../hook/use-format-inzhur-pending-top-up.hook';
import { InzhurSelector } from '../../selector/inzhur.selector';
import { InzhurPendingTopUpService } from '../../service/inzhur-pending-top-up.service';

import type { InzhurPendingTopUpInterface } from '@budgie/sync';

interface Props {
    readonly topUp: InzhurPendingTopUpInterface;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const InzhurPendingTopUpCard = ({ topUp }: Props) => {
    const { t } = useLingui();
    const { run } = useSingleFlight();
    const formatPendingTopUp = useFormatInzhurPendingTopUp();
    const { transactionId, externalId } = topUp;
    const { summary, prompt } = formatPendingTopUp(topUp);
    const promptSegments = [prompt];

    const handleEnterPurchase = () => void router.push({ pathname: '/inzhur/purchase', params: { topUpId: String(transactionId) } });
    const handleDismiss = () =>
        void run(Effect.flatMap(InzhurPendingTopUpService, inzhurPendingTopUpService => inzhurPendingTopUpService.dismiss(externalId)));

    return (
        <View
            className="gap-y-lg rounded-3xl bg-surface-row px-3xl py-lg"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.PendingTopUp(transactionId)}
        >
            <ListRow
                leading={<NeutralIconTile icon={UserIconNameEnum.ArrowDown} iconClassName="text-warning-strong" />}
                title={<Text className="text-[17px] font-semibold text-primary">{summary}</Text>}
                detail={<ListRowDetail segments={promptSegments} />}
            />
            <View className="flex-row gap-x-md">
                <Button
                    className="min-h-11 flex-1"
                    size="sm"
                    variant="primary"
                    content={t`Enter purchase`}
                    onPress={handleEnterPurchase}
                    testID={InzhurSelector.PendingTopUpEnterButton(transactionId)}
                />
                <Button
                    className="min-h-11 flex-1"
                    size="sm"
                    variant="secondary"
                    content={t`Dismiss`}
                    onPress={handleDismiss}
                    testID={InzhurSelector.PendingTopUpDismissButton(transactionId)}
                />
            </View>
        </View>
    );
};
