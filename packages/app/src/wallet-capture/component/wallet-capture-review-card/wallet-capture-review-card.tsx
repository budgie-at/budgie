import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { WalletCaptureReviewReasonEnum } from '../../enum/wallet-capture-review-reason.enum';

import { WalletCaptureReviewCardSelector } from './wallet-capture-review-card.selector';

import type { WalletCaptureReviewItemInterface } from '../../interface/wallet-capture-review-item.interface';

const getReasonText = (reason: WalletCaptureReviewReasonEnum, t: ReturnType<typeof useLingui>['t']) => {
    switch (reason) {
        case WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE:
            return t`The selected Budgie account is archived or no longer exists.`;
        case WalletCaptureReviewReasonEnum.DUPLICATE:
            return t`This capture looks similar to an existing transaction.`;
        case WalletCaptureReviewReasonEnum.INVALID_PAYLOAD:
        default:
            return t`The Wallet automation did not provide a usable amount or merchant.`;
    }
};

interface Props {
    readonly item: WalletCaptureReviewItemInterface;
    readonly accountTitle: string;
    readonly instrumentSymbol: string;
    readonly isMutating: boolean;
    readonly onImport: (captureId: string) => void;
    readonly onDismiss: (captureId: string) => void;
}

export const WalletCaptureReviewCard = ({ item, accountTitle, instrumentSymbol, isMutating, onImport, onDismiss }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    const { capture, duplicateTransactionId, reason } = item;
    const merchant = isNotEmptyString(capture.merchant.trim()) ? capture.merchant.trim() : t`Apple Pay purchase`;
    const amount = formatDigits(capture.amount, instrumentSymbol);
    const capturedAt = formatDayAndMonthAndYearWithTime(capture.capturedAt);
    const reasonText = getReasonText(reason, t);
    const cardNameText = isNotEmptyString(capture.cardName) ? capture.cardName : t`Unknown card`;
    const canImportCapture = reason !== WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE;

    const handleImport = () => void onImport(capture.captureId);
    const handleDismiss = () => void onDismiss(capture.captureId);
    const handleOpenDuplicate = () => {
        if (isDefined(duplicateTransactionId)) {
            void router.push(`/transactions/${duplicateTransactionId}/expense`);
        }
    };

    return (
        <Card testID={WalletCaptureReviewCardSelector.Card(capture.captureId)} className="gap-y-3xl">
            <View className="gap-y-xs">
                <Text className="text-primary text-base font-semibold">{merchant}</Text>
                <Text className="text-primary text-xl font-semibold">{amount}</Text>
                <Text className="text-secondary-foreground text-sm">{capturedAt}</Text>
            </View>

            <View className="gap-y-xs">
                <Text className="text-secondary-foreground text-sm">{t`Account: ${accountTitle}`}</Text>
                <Text className="text-secondary-foreground text-sm">{t`Card: ${cardNameText}`}</Text>
                <Text className="text-secondary-foreground text-sm">{reasonText}</Text>
            </View>

            {isDefined(duplicateTransactionId) ? (
                <Button
                    testID={WalletCaptureReviewCardSelector.DuplicateTransactionLink(duplicateTransactionId)}
                    onPress={handleOpenDuplicate}
                    content={t`Open possible duplicate`}
                    rightIcon={UserIconNameEnum.ChevronRight}
                    size="sm"
                    variant="secondary"
                />
            ) : null}

            <View className="flex-row gap-x-lg">
                {canImportCapture ? (
                    <Button
                        className="flex-1"
                        testID={WalletCaptureReviewCardSelector.ImportButton(capture.captureId)}
                        onPress={handleImport}
                        content={t`Import anyway`}
                        leftIcon={UserIconNameEnum.Download}
                        size="sm"
                        variant="positive"
                        disabled={isMutating}
                        isLoading={isMutating}
                    />
                ) : null}
                <Button
                    className="flex-1"
                    testID={WalletCaptureReviewCardSelector.DismissButton(capture.captureId)}
                    onPress={handleDismiss}
                    content={t`Dismiss`}
                    leftIcon={UserIconNameEnum.X}
                    size="sm"
                    variant="ghost"
                    disabled={isMutating}
                />
            </View>
        </Card>
    );
};
