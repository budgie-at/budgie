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

    const refresh = useCallback(async () => {
        const requestId = requestIdRef.current + 1;
        requestIdRef.current = requestId;

        if (!isMountedRef.current) {
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const nextPreview = await bankSyncRepairService.previewDuplicates();

            if (!isMountedRef.current || requestIdRef.current !== requestId) {
                return;
            }

            setPreview(nextPreview);
        } catch (error) {
            if (!isMountedRef.current || requestIdRef.current !== requestId) {
                return;
            }

            setPreview(null);
            setErrorMessage(getErrorMessage(error));
        } finally {
            if (isMountedRef.current && requestIdRef.current === requestId) {
                setIsLoading(false);
            }
        }
    }, []);

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
