import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { bankSyncRepairService } from '../service/bank-sync-repair.service';

import type { BankSyncDuplicateRepairPreviewInterface } from '../interface/bank-sync-duplicate-repair-preview.interface';

export const useBankSyncDuplicateRepairPreviewQuery = () => {
    const isMountedRef = useRef(false);
    const requestIdRef = useRef(0);
    const [preview, setPreview] = useState<BankSyncDuplicateRepairPreviewInterface | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isCurrentRequest = useCallback((requestId: number) => isMountedRef.current && requestIdRef.current === requestId, []);

    const handleRefreshSuccess = useCallback(
        (requestId: number, nextPreview: BankSyncDuplicateRepairPreviewInterface) => {
            if (!isCurrentRequest(requestId)) {
                return;
            }

            setPreview(nextPreview);
        },
        [isCurrentRequest]
    );

    const handleRefreshError = useCallback(
        (requestId: number, error: unknown) => {
            if (!isCurrentRequest(requestId)) {
                return;
            }

            setPreview(null);
            setErrorMessage(getErrorMessage(error));
        },
        [isCurrentRequest]
    );

    const handleRefreshComplete = useCallback(
        (requestId: number) => {
            if (isCurrentRequest(requestId)) {
                setIsLoading(false);
            }
        },
        [isCurrentRequest]
    );

    const refresh = useCallback(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!isCurrentRequest(requestId)) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const nextPreview = await bankSyncRepairService.previewDuplicates();
            handleRefreshSuccess(requestId, nextPreview);
        } catch (error) {
            handleRefreshError(requestId, error);
        } finally {
            handleRefreshComplete(requestId);
        }
    }, [handleRefreshComplete, handleRefreshError, handleRefreshSuccess, isCurrentRequest]);

    useEffect(() => {
        isMountedRef.current = true;
        void refresh();

        return () => {
            isMountedRef.current = false;
            requestIdRef.current += 1;
        };
    }, [refresh]);

    return { errorMessage, isLoading, preview, refresh };
};
