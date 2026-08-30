import { useLingui } from '@lingui/react/macro';
import { useCallback, useState } from 'react';

import { getErrorMessage, isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { accountRepository, instrumentRepository } from '../../@generic/drizzle/db/db';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { walletCaptureAccountMirrorService } from '../service/wallet-capture-account-mirror.service';
import { walletCaptureImportService } from '../service/wallet-capture-import.service';

import type { WalletCaptureReviewItemInterface } from '../interface/wallet-capture-review-item.interface';

const loadWalletCaptureSettingsData = async () => {
    await walletCaptureAccountMirrorService.refresh();

    const reviewItems = await walletCaptureImportService.getReviewItems();
    const accountIds = reviewItems.map(item => item.capture.accountId);
    const uniqueAccountIds = [...new Set(accountIds)];
    const accounts = await accountRepository.findByIds(uniqueAccountIds);
    const accountDetails = await Promise.all(
        accounts.map(async account => ({
            account,
            instrument: await instrumentRepository.findByIdAsync(account.instrumentId)
        }))
    );
    const accountTitlesById = accountDetails.reduce<Record<number, string>>((result, detail) => {
        result[detail.account.id] = detail.account.title;

        return result;
    }, {});
    const instrumentSymbolsByAccountId = accountDetails.reduce<Record<number, string>>((result, detail) => {
        if (isDefined(detail.instrument)) {
            result[detail.account.id] = detail.instrument.symbol;
        }

        return result;
    }, {});

    return { reviewItems, accountTitlesById, instrumentSymbolsByAccountId };
};

export const useWalletCaptureSettings = () => {
    const { t } = useLingui();
    const [reviewItems, setReviewItems] = useState<WalletCaptureReviewItemInterface[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [mutatingCaptureIds, setMutatingCaptureIds] = useState<Record<string, boolean>>({});
    const [accountTitlesById, setAccountTitlesById] = useState<Record<number, string>>({});
    const [instrumentSymbolsByAccountId, setInstrumentSymbolsByAccountId] = useState<Record<number, string>>({});

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const nextSettingsData = await loadWalletCaptureSettingsData();

            setReviewItems(nextSettingsData.reviewItems);
            setAccountTitlesById(nextSettingsData.accountTitlesById);
            setInstrumentSymbolsByAccountId(nextSettingsData.instrumentSymbolsByAccountId);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const runCaptureMutation = useCallback(
        async (captureId: string, mutation: (selectedCaptureId: string) => Promise<void>) => {
            setMutatingCaptureIds(previous => ({ ...previous, [captureId]: true }));

            try {
                await mutation(captureId);
                await refresh();
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
            } finally {
                setMutatingCaptureIds(previous => ({ ...previous, [captureId]: false }));
            }
        },
        [refresh]
    );

    const importCapture = useCallback(
        (captureId: string) => {
            void runCaptureMutation(captureId, walletCaptureImportService.forceImport.bind(walletCaptureImportService));
        },
        [runCaptureMutation]
    );

    const dismissCapture = useCallback(
        async (captureId: string) => {
            const confirmed = await confirmAlert({
                title: t`Dismiss Wallet capture?`,
                message: t`This removes the pending capture without creating a transaction.`,
                confirmText: t`Dismiss`,
                cancelText: t`Cancel`,
                isDestructive: true
            });

            if (!confirmed) {
                return;
            }

            await runCaptureMutation(captureId, walletCaptureImportService.dismiss.bind(walletCaptureImportService));
        },
        [runCaptureMutation, t]
    );

    const getAccountTitle = useCallback(
        (accountId: number, fallback: string) => {
            const accountTitle = accountTitlesById[accountId];

            return isDefined(accountTitle) ? accountTitle : fallback;
        },
        [accountTitlesById]
    );

    const getAccountInstrumentSymbol = useCallback(
        (accountId: number, fallback: string) => {
            const instrumentSymbol = instrumentSymbolsByAccountId[accountId];

            return isDefined(instrumentSymbol) ? instrumentSymbol : fallback;
        },
        [instrumentSymbolsByAccountId]
    );

    return {
        reviewItems,
        isLoading,
        errorMessage,
        mutatingCaptureIds,
        hasReviewItems: isNotEmptyArray(reviewItems),
        refresh,
        importCapture,
        dismissCapture,
        getAccountTitle,
        getAccountInstrumentSymbol
    };
};
