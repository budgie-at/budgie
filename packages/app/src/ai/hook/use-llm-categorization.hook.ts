import { AITransactionInterface, ExtractedVoiceTransactionInterface, findAccountByCurrency } from '@budgie/ai';
import { AccountWithInstrumentEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useState } from 'react';

import { getErrorMessage, isNotEmptyArray } from '@rnw-community/shared';

import { useSearchAccountsSortedQuery } from '../../account/query/use-search-accounts-sorted.query';
import { AiSubsystemStatusEnum } from '../enum/ai-subsystem-status.enum';
import { voiceService } from '../service/voice.service';
import { aiLog } from '../utils/ai-log.util';

import { useAiDownloadProgress } from './use-ai-download-progress.hook';
import { useChat } from './use-chat.hook';

type CategorizationStatus = 'idle' | 'processing' | 'done' | 'error';

interface UseLlmCategorizationReturnInterface {
    readonly status: CategorizationStatus;
    readonly transactions: AITransactionInterface[];
    readonly error: string | null;
    readonly isReady: boolean;
    readonly downloadProgress: number;
    readonly categorize: (text: string) => Promise<AITransactionInterface[]>;
    readonly reset: () => void;
}

const mapExtractedToTransactions = (
    extracted: ExtractedVoiceTransactionInterface[],
    accounts: AccountWithInstrumentEntityInterface[]
): AITransactionInterface[] =>
    extracted.map(item => ({
        category: null,
        amount: item.amount,
        currency: item.currency,
        account: findAccountByCurrency(accounts, item.currency),
        type: TransactionTypeEnum.EXPENSE,
        comment: item.description
    }));

export const useLlmCategorization = (): UseLlmCategorizationReturnInterface => {
    const { accounts } = useSearchAccountsSortedQuery();
    const { status: chatStatus } = useChat();
    const downloadProgress = useAiDownloadProgress();

    const [status, setStatus] = useState<CategorizationStatus>('idle');
    const [transactions, setTransactions] = useState<AITransactionInterface[]>([]);
    const [error, setError] = useState<string | null>(null);

    // eslint-disable-next-line max-statements -- Extract, map, and surface extraction errors with structured logs
    const categorize = async (text: string): Promise<AITransactionInterface[]> => {
        aiLog('voice:categorize:start', { textLen: text.length });
        setStatus('processing');
        setError(null);
        setTransactions([]);

        try {
            const extracted = await voiceService.extractTransactions(text);
            aiLog('voice:categorize:extracted', { count: extracted.length });

            if (!isNotEmptyArray(extracted)) {
                // eslint-disable-next-line lingui/no-unlocalized-strings -- Internal error, not user-facing
                throw new Error('Failed to extract transactions from text');
            }

            const results = mapExtractedToTransactions(extracted, accounts);
            aiLog('voice:categorize:mapped', { count: results.length });
            setTransactions(results);
            setStatus('done');

            return results;
        } catch (err: unknown) {
            aiLog('voice:categorize:throw', { errorMessage: getErrorMessage(err) });
            setError(getErrorMessage(err));
            setStatus('error');
            throw err;
        }
    };

    const reset = (): void => {
        aiLog('voice:categorize:reset');
        setStatus('idle');
        setTransactions([]);
        setError(null);
    };

    return {
        status,
        transactions,
        error,
        isReady: chatStatus === AiSubsystemStatusEnum.Ready,
        downloadProgress,
        categorize,
        reset
    };
};
