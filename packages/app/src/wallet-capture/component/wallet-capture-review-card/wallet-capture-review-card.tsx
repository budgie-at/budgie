import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Card } from '../../../@generic/component/card/card';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { WalletCaptureReviewReasonEnum } from '../../enum/wallet-capture-review-reason.enum';
import { WalletCaptureReviewDetailRow } from '../wallet-capture-review-detail-row/wallet-capture-review-detail-row';
import { WalletCaptureReviewReasonIcon } from '../wallet-capture-review-reason-icon/wallet-capture-review-reason-icon';

import { WalletCaptureReviewCardSelector } from './wallet-capture-review-card.selector';

import type { WalletCaptureReviewItemInterface } from '../../interface/wallet-capture-review-item.interface';

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
    const formatDigits = useDisplayFormatDigits();
    const { formatDayAndMonthAndYearWithTime } = useFormatDate();

    const getReasonText = (reason: WalletCaptureReviewReasonEnum) => {
        switch (reason) {
            case WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE:
                return t`The selected Budgie account is archived or no longer exists.`;
            case WalletCaptureReviewReasonEnum.CURRENCY_UNAVAILABLE:
                return t`Budgie has no exchange rate for this payment currency yet.`;
            case WalletCaptureReviewReasonEnum.DUPLICATE:
            default:
                return t`This capture looks similar to an existing transaction.`;
        }
    };

    const { capture, duplicateTransactionId, reason } = item;
    const merchant = isNotEmptyString(capture.merchant.trim()) ? capture.merchant.trim() : t`Apple Pay purchase`;
    const amount = formatDigits(capture.amount, isNotEmptyString(capture.currency) ? capture.currency : instrumentSymbol);
    const reasonText = getReasonText(reason);
    const cardNameText = isNotEmptyString(capture.cardName) ? capture.cardName : t`Unknown card`;
    const canImportCapture =
        reason !== WalletCaptureReviewReasonEnum.ACCOUNT_UNAVAILABLE && reason !== WalletCaptureReviewReasonEnum.CURRENCY_UNAVAILABLE;

    const handleImport = () => void onImport(capture.captureId);
    const handleDismiss = () => void onDismiss(capture.captureId);
    const handleOpenDuplicate = () => {
        if (isDefined(duplicateTransactionId)) {
            void router.push(`/transactions/${duplicateTransactionId}/expense`);
        }
    };

    return (
        <Card testID={WalletCaptureReviewCardSelector.Card(capture.captureId)} size="md" className="gap-y-xl">
            <View className="flex-row items-center gap-x-xl">
                <WalletCaptureReviewReasonIcon reason={reason} />
                <View className="flex-1 gap-y-xxs">
                    <Text className="text-primary text-base font-semibold" numberOfLines={1}>
                        {merchant}
                    </Text>
                    <Text className="text-secondary-foreground text-xs">{formatDayAndMonthAndYearWithTime(capture.capturedAt)}</Text>
                </View>
                <Text className="text-primary text-lg font-semibold">{amount}</Text>
            </View>

            <View className="rounded-3xl border border-secondary-corner bg-ghost-background px-xl py-lg gap-y-sm">
                <WalletCaptureReviewDetailRow label={t`Account`} value={accountTitle} />
                <WalletCaptureReviewDetailRow label={t`Card`} value={cardNameText} />
            </View>

            <Text className="text-secondary-foreground text-sm">{reasonText}</Text>

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
