import { ReceiptMatchResultKindEnum } from '@budgie/ledger';
import { useAtomSet } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import { NotificationFeedbackType } from 'expo-haptics';
import { router } from 'expo-router';
import { AccessibilityInfo } from 'react-native';
import Toast from 'react-native-toast-message';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useVibration } from '../../@generic/hook/use-vibration.hook';
import { appRuntime } from '../../@generic/runtime/app.runtime';
import { useI18nContext } from '../../i18n/context/i18n.context';
import { pendingReceiptAtom } from '../constant/pending-receipt-atom.constant';
import { RECEIPT_SCAN_TOAST_TYPE } from '../constant/receipt-scan-toast-type.constant';
import { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';
import { ReceiptScanToastStatusEnum } from '../enum/receipt-scan-toast-status.enum';
import { ReceiptScanService } from '../service/receipt-scan.service';

import type { ReceiptProposalInterface } from '../interface/receipt-proposal.interface';

export const useReceiptScan = () => {
    const { t } = useLingui();
    const [hapticNotification] = useVibration();
    const { intl } = useI18nContext();
    const setPendingReceipt = useAtomSet(pendingReceiptAtom);

    const showToast = (
        status: Exclude<ReceiptScanToastStatusEnum, ReceiptScanToastStatusEnum.READING>,
        transactionId: number | null,
        text1: string,
        text2?: string
    ) => {
        const handlePress = () => {
            Toast.hide();
            if (isDefined(transactionId)) {
                router.push({ pathname: '/transactions/[id]/expense', params: { id: String(transactionId) } });
            }
        };

        hapticNotification(
            status === ReceiptScanToastStatusEnum.DUPLICATE ? NotificationFeedbackType.Warning : NotificationFeedbackType.Error
        );

        Toast.show({ type: RECEIPT_SCAN_TOAST_TYPE, props: status, text1, text2, onPress: handlePress });
        AccessibilityInfo.announceForAccessibilityWithOptions([text1, text2].filter(isNotEmptyString).join(', '), { queue: true });
    };

    const showDuplicate = ({ transactionId, title, amount, currency }: ReceiptProposalInterface) => {
        const outcome = t`Already scanned`;
        const subtitle =
            isDefined(amount) && isDefined(currency)
                ? `${intl.formatNumber(-amount, { style: 'currency', currency })} · ${outcome}`
                : outcome;

        showToast(ReceiptScanToastStatusEnum.DUPLICATE, transactionId, isNotEmptyString(title) ? title : t`Receipt`, subtitle);
    };

    const openForm = (proposal: ReceiptProposalInterface) => {
        Toast.hide();
        setPendingReceipt(isDefined(proposal.receipt) ? { receipt: proposal.receipt, transactionId: proposal.transactionId } : null);

        if (proposal.kind === ReceiptMatchResultKindEnum.MATCHED && isDefined(proposal.transactionId)) {
            router.push({ pathname: '/transactions/[id]/expense/edit', params: { id: String(proposal.transactionId) } });

            return;
        }

        router.push({
            pathname: '/create-transaction/expense',
            params: {
                aiContext: proposal.aiContext,
                ...(isNotEmptyString(proposal.title) && { title: proposal.title }),
                ...(isNotEmptyString(proposal.comment) && { comment: proposal.comment }),
                ...(isPositiveNumber(proposal.amount) && { amount: String(proposal.amount) }),
                ...(isPositiveNumber(proposal.categoryId) && { categoryId: String(proposal.categoryId) }),
                ...(isPositiveNumber(proposal.accountId) && { accountId: String(proposal.accountId) }),
                ...(isDefined(proposal.operatedAt) && { operatedAt: proposal.operatedAt.toISOString() })
            }
        });
    };

    const showResult = (proposal: ReceiptProposalInterface) => {
        if (proposal.kind === ReceiptMatchResultKindEnum.DUPLICATE) {
            showDuplicate(proposal);
        } else if (proposal.kind === ReceiptScanFailureEnum.NO_TEXT || proposal.kind === ReceiptScanFailureEnum.FAILED) {
            showToast(ReceiptScanToastStatusEnum.NOT_FOUND, null, t`No receipt found`);
        } else {
            openForm(proposal);
        }
    };

    return (uri: string | null): void => {
        if (!isDefined(uri)) {
            return;
        }

        Toast.show({
            type: RECEIPT_SCAN_TOAST_TYPE,
            props: ReceiptScanToastStatusEnum.READING,
            autoHide: false
        });
        appRuntime.runFork(
            Effect.flatMap(ReceiptScanService, receiptScanService => receiptScanService.process(uri)).pipe(
                Effect.tap(proposal => Effect.sync(() => void showResult(proposal))),
                Effect.tapCause(Effect.logError),
                Effect.catchCause(() => Effect.sync(() => void showToast(ReceiptScanToastStatusEnum.NOT_FOUND, null, t`No receipt found`)))
            )
        );
    };
};
