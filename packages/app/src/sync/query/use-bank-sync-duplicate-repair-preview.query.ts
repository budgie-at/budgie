import { useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { bankSyncRepairService } from '../service/bank-sync-repair.service';

import type { BankSyncDuplicateRepairPreviewInterface } from '../interface/bank-sync-duplicate-repair-preview.interface';

export const useBankSyncDuplicateRepairPreviewQuery = () => {
    const isMountedRef = useRef(false);
    const requestIdRef = useRef(0);
    const [preview, setPreview] = useState<BankSyncDuplicateRepairPreviewInterface | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isCurrentRequest = (requestId: number) => isMountedRef.current && requestIdRef.current === requestId;

    const refreshRef = useRef<() => Promise<void>>(() => Promise.resolve());

    const startRefresh = (requestId: number): boolean => {
        if (!isCurrentRequest(requestId)) {
            return false;
        }

        setIsLoading(true);
        setErrorMessage(null);

        return true;
    };

    const applyPreview = (requestId: number, nextPreview: BankSyncDuplicateRepairPreviewInterface): void => {
        if (isCurrentRequest(requestId)) {
            setPreview(nextPreview);
        }
    };

    const applyError = (requestId: number, error: unknown): void => {
        if (isCurrentRequest(requestId)) {
            setPreview(null);
            setErrorMessage(getErrorMessage(error));
        }
    };

    const completeRefresh = (requestId: number): void => {
        if (isCurrentRequest(requestId)) {
            setIsLoading(false);
        }
    };

    refreshRef.current = async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!startRefresh(requestId)) {
            return;
        }

        try {
            const nextPreview = await bankSyncRepairService.previewDuplicates();
            applyPreview(requestId, nextPreview);
        } catch (error) {
            applyError(requestId, error);
        } finally {
            completeRefresh(requestId);
        }
    };

    const refresh = () => refreshRef.current();

    useEffect(() => {
        isMountedRef.current = true;
        void refreshRef.current();

        return () => {
            isMountedRef.current = false;
            requestIdRef.current += 1;
        };
    }, []);

    return { errorMessage, isLoading, preview, refresh };
};
