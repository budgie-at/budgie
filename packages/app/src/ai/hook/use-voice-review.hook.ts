import { transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { useReducer, useState } from 'react';

import { getErrorMessage } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { transactionBatchCreateService } from '../../transaction/service/transaction-batch-create.service';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';
import { mapReviewRowsToCreateInputs } from '../utils/map-review-rows-to-create-inputs.util';

type ReviewAction =
    | {
          readonly type: 'EDIT';
          readonly id: string;
          readonly patch: Partial<Pick<VoiceReviewRowInterface, 'amountMicroUnits' | 'description'>>;
      }
    | { readonly type: 'DELETE'; readonly id: string };

const reducer = (state: VoiceReviewRowInterface[], action: ReviewAction): VoiceReviewRowInterface[] => {
    if (action.type === 'EDIT') {
        return state.map(row => (row.id === action.id ? { ...row, ...action.patch } : row));
    }

    return state.filter(row => row.id !== action.id);
};

interface UseVoiceReviewReturnInterface {
    readonly rows: VoiceReviewRowInterface[];
    readonly isSaving: boolean;
    readonly editRow: (id: string, patch: Partial<Pick<VoiceReviewRowInterface, 'amountMicroUnits' | 'description'>>) => void;
    readonly deleteRow: (id: string) => void;
    readonly saveAll: (params: { readonly accountId: number; readonly categoryId: number }) => Promise<boolean>;
}

class VoiceReviewSaver {
    @Log(
        params => `enter count=${params.rows.length} accountId=${params.accountId} categoryId=${params.categoryId}`,
        (result, params) => `done count=${params.rows.length} insertedIds=${result.map(row => row.id).join(',')}`,
        (error, params) => `throw count=${params.rows.length} error=${getErrorMessage(error)}`
    )
    async saveBatch(params: { readonly rows: VoiceReviewRowInterface[]; readonly accountId: number; readonly categoryId: number }) {
        const inputs = mapReviewRowsToCreateInputs(params.rows, new Date(), params.accountId, params.categoryId);

        return transactionAsync(db, async txDb => transactionBatchCreateService.create(inputs, txDb));
    }
}

const voiceReviewSaver = new VoiceReviewSaver();

export const useVoiceReview = (initialRows: VoiceReviewRowInterface[]): UseVoiceReviewReturnInterface => {
    const [rows, dispatch] = useReducer(reducer, initialRows);
    const [isSaving, setIsSaving] = useState(false);

    const editRow = (id: string, patch: Partial<Pick<VoiceReviewRowInterface, 'amountMicroUnits' | 'description'>>) => {
        dispatch({ type: 'EDIT', id, patch });
    };

    const deleteRow = (id: string) => {
        dispatch({ type: 'DELETE', id });
    };

    const saveAll = async (params: { readonly accountId: number; readonly categoryId: number }): Promise<boolean> => {
        setIsSaving(true);
        try {
            await voiceReviewSaver.saveBatch({ rows, accountId: params.accountId, categoryId: params.categoryId });

            return true;
        } catch {
            setIsSaving(false);

            return false;
        }
    };

    return { rows, isSaving, editRow, deleteRow, saveAll };
};
