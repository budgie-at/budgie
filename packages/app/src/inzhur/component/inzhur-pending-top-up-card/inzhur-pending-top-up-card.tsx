import { ExternalSourceEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Button } from '../../../@generic/component/button/button';
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
    const { transactionId } = topUp;

    const handleImport = () => void router.push({ pathname: '/create-account/[type]', params: { type: ExternalSourceEnum.INZHUR } });
    const handleEnterPurchase = () => void router.push({ pathname: '/inzhur/purchase', params: { topUpId: String(transactionId) } });
    const handleDismiss = () =>
        void run(Effect.flatMap(InzhurPendingTopUpService, inzhurPendingTopUpService => inzhurPendingTopUpService.dismiss(transactionId)));

    return (
        <View
            className="gap-y-lg rounded-3xl bg-surface-row px-3xl py-lg"
            style={CONTINUOUS_CORNERS}
            testID={InzhurSelector.PendingTopUp(transactionId)}
        >
            <Text className="text-[15px] leading-[20px] text-primary">{formatPendingTopUp(topUp)}</Text>
            <View className="flex-row flex-wrap items-center gap-x-md gap-y-md">
                <Button
                    size="sm"
                    variant="primary"
                    content={t`Enter purchase`}
                    onPress={handleEnterPurchase}
                    testID={InzhurSelector.PendingTopUpEnterButton(transactionId)}
                />
                <Button
                    size="sm"
                    variant="secondary"
                    content={t`Import statement`}
                    onPress={handleImport}
                    testID={InzhurSelector.PendingTopUpImportButton(transactionId)}
                />
                <Button
                    size="sm"
                    variant="ghost"
                    content={t`Dismiss`}
                    onPress={handleDismiss}
                    testID={InzhurSelector.PendingTopUpDismissButton(transactionId)}
                />
            </View>
        </View>
    );
};
