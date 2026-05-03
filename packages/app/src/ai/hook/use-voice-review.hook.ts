import { TransactionEntityInterface, transactionAsync } from '@budgie/contracts';
import { Log } from '@budgie/logger';
import { useReducer, useState } from 'react';

import { getErrorMessage, isPositiveNumber } from '@rnw-community/shared';

import { db } from '../../@generic/drizzle/db/db';
import { transactionBatchCreateService } from '../../transaction/service/transaction-batch-create.service';
import { VoiceReviewRowInterface } from '../interface/voice-review-row.interface';
import { mapReviewRowsToCreateInputs } from '../utils/map-review-rows-to-create-inputs.util';

type ReviewAction =
    | { readonly type: 'EDIT_AMOUNT'; readonly id: string; readonly amount: number }
    | { readonly type: 'SET_CATEGORY'; readonly id: string; readonly categoryId: number }
    | { readonly type: 'DELETE'; readonly id: string };

const reducer = (state: VoiceReviewRowInterface[], action: ReviewAction): VoiceReviewRowInterface[] => {
    if (action.type === 'EDIT_AMOUNT') {
        return state.map(row => (row.id === action.id ? { ...row, amount: action.amount } : row));
    }
    if (action.type === 'SET_CATEGORY') {
        return state.map(row => (row.id === action.id ? { ...row, categoryId: action.categoryId } : row));
    }

    return state.filter(row => row.id !== action.id);
};

interface UseVoiceReviewReturnInterface {
    readonly rows: VoiceReviewRowInterface[];
    readonly isSaving: boolean;
    readonly canSave: boolean;
    readonly editAmount: (id: string, amount: number) => void;
    readonly setCategory: (id: string, categoryId: number) => void;
    readonly deleteRow: (id: string) => void;
    readonly saveAll: (accountId: number) => Promise<TransactionEntityInterface[] | null>;
}

class VoiceReviewSaver {
    @Log(
        params => `enter count=${params.rows.length} accountId=${params.accountId}`,
        (result, params) => `done count=${params.rows.length} insertedIds=${result.map(row => row.id).join(',')}`,
        (error, params) => `throw count=${params.rows.length} error=${getErrorMessage(error)}`
    )
    async saveBatch(params: { readonly rows: VoiceReviewRowInterface[]; readonly accountId: number }) {
        const inputs = mapReviewRowsToCreateInputs(params.rows, new Date(), params.accountId);

        return transactionAsync(db, async txDb => transactionBatchCreateService.create(inputs, txDb));
    }
}

const voiceReviewSaver = new VoiceReviewSaver();

export const useVoiceReview = (initialRows: VoiceReviewRowInterface[]): UseVoiceReviewReturnInterface => {
    const [rows, dispatch] = useReducer(reducer, initialRows);
    const [isSaving, setIsSaving] = useState(false);

    const editAmount = (id: string, amount: number) => {
        dispatch({ type: 'EDIT_AMOUNT', id, amount });
    };
    const setCategory = (id: string, categoryId: number) => {
        dispatch({ type: 'SET_CATEGORY', id, categoryId });
    };
    const deleteRow = (id: string) => {
        dispatch({ type: 'DELETE', id });
    };

    const canSave = rows.length > 0 && rows.every(row => isPositiveNumber(row.categoryId) && row.amount > 0);

    const saveAll = async (accountId: number): Promise<TransactionEntityInterface[] | null> => {
        setIsSaving(true);
        try {
            return await voiceReviewSaver.saveBatch({ rows, accountId });
        } catch {
            setIsSaving(false);

            return null;
        }
    };

    return { rows, isSaving, canSave, editAmount, setCategory, deleteRow, saveAll };
};
