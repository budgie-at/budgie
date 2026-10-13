import { AccountEntityTable, AccountRepository, InstrumentEntityTable, InstrumentRepository } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useCallback, useState } from 'react';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { appAtomRuntime, appRuntime } from '../../@generic/runtime/app.runtime';
import { confirmAlert } from '../../@generic/utils/confirm-alert/confirm-alert.util';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { WalletCaptureReactivityKeyEnum } from '../enum/wallet-capture-reactivity-key.enum';
import { WalletCaptureAccountMirrorService } from '../service/wallet-capture-account-mirror.service';
import { WalletCaptureImportService } from '../service/wallet-capture-import.service';

import type { AppServices } from '../../@generic/runtime/app.runtime';

const walletCaptureSettingsAtom = appAtomRuntime.factory.withReactivity([WalletCaptureReactivityKeyEnum.CAPTURES])(
    databaseQueryAtom(
        [AccountEntityTable, InstrumentEntityTable],
        Effect.gen(function* () {
            const captureImportService = yield* WalletCaptureImportService;
            const accountRepository = yield* AccountRepository;
            const instrumentRepository = yield* InstrumentRepository;
            const reviewItems = yield* captureImportService.getReviewItems();
            const accounts = yield* accountRepository.findByIds([...new Set(reviewItems.map(item => item.capture.accountId))]);
            const accountDetails = yield* Effect.forEach(accounts, account =>
                Effect.map(instrumentRepository.findById(account.instrumentId), instrument => ({ account, instrument }))
            );

            return { reviewItems, accountDetails };
        })
    )
);

export const useWalletCaptureSettings = () => {
    const { t } = useLingui();
    const result = useLiveAtomValue(walletCaptureSettingsAtom);
    const refreshAtom = useAtomRefresh(walletCaptureSettingsAtom);
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [mutatingCaptureIds, setMutatingCaptureIds] = useState<Record<string, boolean>>({});
    const reviewItems = AsyncResult.isSuccess(result) ? result.value.reviewItems : [];
    const accountDetails = AsyncResult.isSuccess(result) ? result.value.accountDetails : [];
    const errorMessage = mutationError ?? (AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null);

    const refresh = useCallback(() => {
        appRuntime.runFork(
            Effect.flatMap(WalletCaptureAccountMirrorService, service => service.refresh()).pipe(
                Effect.tapCause(Effect.logError),
                Effect.matchCause({
                    onFailure: cause => void setMutationError(getErrorMessage(Cause.squash(cause))),
                    onSuccess: refreshAtom
                })
            )
        );
    }, [refreshAtom]);

    const runCaptureMutation = (captureId: string, mutation: Effect.Effect<unknown, unknown, AppServices>) => {
        setMutatingCaptureIds(previous => ({ ...previous, [captureId]: true }));
        setMutationError(null);
        appRuntime.runFork(
            mutation.pipe(
                Effect.tapCause(Effect.logError),
                Effect.matchCause({
                    onFailure: cause => void setMutationError(getErrorMessage(Cause.squash(cause))),
                    onSuccess: refreshAtom
                }),
                Effect.ensuring(Effect.sync(() => void setMutatingCaptureIds(previous => ({ ...previous, [captureId]: false }))))
            )
        );
    };

    const importCapture = (captureId: string) =>
        void runCaptureMutation(
            captureId,
            Effect.flatMap(WalletCaptureImportService, service => service.forceImport(captureId))
        );

    const dismissCapture = (captureId: string) => {
        appRuntime.runFork(
            Effect.gen(function* () {
                const confirmed = yield* Effect.promise(() =>
                    confirmAlert({
                        title: t`Dismiss Wallet capture?`,
                        message: t`This removes the pending capture without creating a transaction.`,
                        confirmText: t`Dismiss`,
                        cancelText: t`Cancel`,
                        isDestructive: true
                    })
                );
                if (confirmed) {
                    runCaptureMutation(
                        captureId,
                        Effect.flatMap(WalletCaptureImportService, service => service.dismiss(captureId))
                    );
                }
            })
        );
    };

    const getAccountTitle = (accountId: number, fallback: string) =>
        accountDetails.find(detail => detail.account.id === accountId)?.account.title ?? fallback;
    const getAccountInstrumentSymbol = (accountId: number, fallback: string) =>
        accountDetails.find(detail => detail.account.id === accountId)?.instrument?.symbol ?? fallback;

    return {
        reviewItems,
        isLoading: result.waiting,
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
