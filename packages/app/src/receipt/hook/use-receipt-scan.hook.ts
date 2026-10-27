import { ReceiptMatchResultKindEnum } from '@budgie/ledger';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { router } from 'expo-router';
import { AccessibilityInfo } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { RECEIPT_SCAN_TOAST_TYPE } from '../constant/receipt-scan-toast-type.constant';
import { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';
import { ReceiptScanToastStatusEnum } from '../enum/receipt-scan-toast-status.enum';
import { ReceiptScanService } from '../service/receipt-scan.service';

import type { ReceiptScanResultInterface } from '../interface/receipt-scan-result.interface';

export const useReceiptScan = () => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();

    const showToast = (status: ReceiptScanToastStatusEnum, text1: string, text2: string, transactionId: number | null) => {
        const handlePress = () => {
            Toast.hide();
            if (isDefined(transactionId)) {
                router.push({ pathname: '/transactions/[id]/expense', params: { id: String(transactionId) } });
            }
        };

        Toast.show({ type: RECEIPT_SCAN_TOAST_TYPE, props: status, text1, text2, onPress: handlePress });
        AccessibilityInfo.announceForAccessibilityWithOptions(text1, { queue: true });
        AccessibilityInfo.announceForAccessibilityWithOptions(text2, { queue: true });
    };

    const showDone = (changed: readonly ReceiptScanResultInterface[], unreadableCount: number) => {
        const matchedCount = changed.filter(result => result.kind === ReceiptMatchResultKindEnum.MATCHED).length;
        const createdCount = changed.length - matchedCount;
        const matchedLabel = t({ message: plural(matchedCount, { one: '# matched', other: '# matched' }) });
        const addedLabel = t({ message: plural(createdCount, { one: '# added', other: '# added' }) });
        const singleLabel = isPositiveNumber(matchedCount) ? matchedLabel : addedLabel;
        const title = isPositiveNumber(matchedCount) && isPositiveNumber(createdCount) ? t`${matchedLabel} · ${addedLabel}` : singleLabel;
        const hint = isPositiveNumber(unreadableCount)
            ? t({ message: plural(unreadableCount, { one: "Couldn't read # receipt", other: "Couldn't read # receipts" }) })
            : t`Tap to open`;

        hapticNotification(NotificationFeedbackType.Success);
        showToast(ReceiptScanToastStatusEnum.DONE, title, hint, changed[0].transactionId);
    };

    const showResult = (results: readonly ReceiptScanResultInterface[]) => {
        const changed = results.filter(
            result => result.kind === ReceiptMatchResultKindEnum.MATCHED || result.kind === ReceiptMatchResultKindEnum.CREATED
        );
        const duplicate = results.find(result => result.kind === ReceiptMatchResultKindEnum.DUPLICATE);
        const manual = results.find(result => isDefined(result.fallback));
        const unreadableCount = results.filter(
            result => result.kind === ReceiptScanFailureEnum.NO_TEXT || result.kind === ReceiptScanFailureEnum.FAILED
        ).length;

        if (isNotEmptyArray(changed)) {
            showDone(changed, unreadableCount);
        } else if (isDefined(duplicate)) {
            const { title } = duplicate;
            const hint = isNotEmptyString(title) ? t`${title} · nothing changed` : t`Nothing changed`;
            showToast(ReceiptScanToastStatusEnum.DUPLICATE, t`Already scanned`, hint, duplicate.transactionId);
        } else if (isDefined(manual)) {
            Toast.hide();
        } else {
            showToast(ReceiptScanToastStatusEnum.NOT_FOUND, t`No receipt found`, t`This image has no readable text`, null);
        }

        if (isDefined(manual?.fallback)) {
            const { amount, aiContext } = manual.fallback;
            router.push({
                pathname: '/create-transaction/expense',
                params: { comment: manual.title, aiContext, ...(isPositiveNumber(amount) && { amount: String(amount) }) }
            });
        }
    };

    return (uris: readonly string[]): void => {
        if (!isNotEmptyArray(uris)) {
            return;
        }

        Toast.show({
            type: RECEIPT_SCAN_TOAST_TYPE,
            props: ReceiptScanToastStatusEnum.READING,
            text2: t`On device · works offline`,
            autoHide: false
        });
        appRuntime.runFork(
            Effect.flatMap(ReceiptScanService, receiptScanService => receiptScanService.process(uris)).pipe(
                Effect.catchCause(cause => Effect.as(Effect.logError(cause), [])),
                Effect.tap(results => Effect.sync(() => void showResult(results)))
            )
        );
    };
};
