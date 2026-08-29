import { useEffect, useRef, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { syncRepairService } from '../service/sync-repair.service';

import type { SyncDuplicateRepairPreviewInterface } from '../interface/sync-duplicate-repair-preview.interface';

export const useSyncDuplicateRepairPreviewQuery = () => {
    const isMountedRef = useRef(false);
    const requestIdRef = useRef(0);
    const [preview, setPreview] = useState<SyncDuplicateRepairPreviewInterface | null>(null);
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

    const applyPreview = (requestId: number, nextPreview: SyncDuplicateRepairPreviewInterface): void => {
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
            const nextPreview = await syncRepairService.previewDuplicates();
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
