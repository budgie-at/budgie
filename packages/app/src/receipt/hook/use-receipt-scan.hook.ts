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
import { useI18nContext } from '../../i18n/context/i18n.context';
import { RECEIPT_SCAN_TOAST_TYPE } from '../constant/receipt-scan-toast-type.constant';
import { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';
import { ReceiptScanToastStatusEnum } from '../enum/receipt-scan-toast-status.enum';
import { ReceiptScanService } from '../service/receipt-scan.service';

import type { ReceiptScanResultInterface } from '../interface/receipt-scan-result.interface';

export const useReceiptScan = () => {
    const { t } = useLingui();
    const { intl } = useI18nContext();
    const [hapticNotification] = useVibration();

    const showToast = (status: ReceiptScanToastStatusEnum, transactionId: number | null, text1: string, text2?: string) => {
        const handlePress = () => {
            Toast.hide();
            if (isDefined(transactionId)) {
                router.push({ pathname: '/transactions/[id]/expense', params: { id: String(transactionId) } });
            }
        };

        if (status === ReceiptScanToastStatusEnum.DONE) {
            hapticNotification(NotificationFeedbackType.Success);
        }

        Toast.show({ type: RECEIPT_SCAN_TOAST_TYPE, props: status, text1, text2, onPress: handlePress });
        AccessibilityInfo.announceForAccessibilityWithOptions([text1, text2].filter(isNotEmptyString).join(', '), { queue: true });
    };

    const getOutcomeLabel = (kind: ReceiptScanResultInterface['kind']) => {
        if (kind === ReceiptMatchResultKindEnum.MATCHED) {
            return t`Matched to existing`;
        }

        if (kind === ReceiptMatchResultKindEnum.DUPLICATE) {
            return t`Already scanned`;
        }

        return t`Added`;
    };

    const showOutcome = ({ kind, transactionId, title, amount, currency }: ReceiptScanResultInterface) => {
        const outcome = getOutcomeLabel(kind);
        const status =
            kind === ReceiptMatchResultKindEnum.DUPLICATE ? ReceiptScanToastStatusEnum.DUPLICATE : ReceiptScanToastStatusEnum.DONE;
        const subtitle =
            isDefined(amount) && isDefined(currency)
                ? `${intl.formatNumber(-amount, { style: 'currency', currency })} · ${outcome}`
                : outcome;

        showToast(status, transactionId, isNotEmptyString(title) ? title : t`Receipt`, subtitle);
    };

    const showResult = (results: readonly ReceiptScanResultInterface[]) => {
        const changed = results.filter(
            result => result.kind === ReceiptMatchResultKindEnum.MATCHED || result.kind === ReceiptMatchResultKindEnum.CREATED
        );
        const outcome = changed.at(0) ?? results.find(result => result.kind === ReceiptMatchResultKindEnum.DUPLICATE);
        const manual = results.find(result => isDefined(result.fallback));
        const unreadableCount = results.filter(
            result => result.kind === ReceiptScanFailureEnum.NO_TEXT || result.kind === ReceiptScanFailureEnum.FAILED
        ).length;
        const unreadableHint = isPositiveNumber(unreadableCount)
            ? t({ message: plural(unreadableCount, { one: "Couldn't read # receipt", other: "Couldn't read # receipts" }) })
            : void 0;

        if (changed.length > 1 || (isNotEmptyArray(changed) && isPositiveNumber(unreadableCount))) {
            const title = t({ message: plural(changed.length, { one: '# receipt saved', other: '# receipts saved' }) });
            showToast(ReceiptScanToastStatusEnum.DONE, changed[0].transactionId, title, unreadableHint);
        } else if (isDefined(outcome)) {
            showOutcome(outcome);
        } else if (isDefined(manual)) {
            Toast.hide();
        } else {
            showToast(ReceiptScanToastStatusEnum.NOT_FOUND, null, t`No receipt found`);
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
