import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { getErrorMessage, isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { Page } from '../../@generic/component/page/page';
import { BottomSheetsProvider } from '../../@generic/providers/bottom-sheets.provider';
import { AnimatedRecordButton } from '../../ai/component/record-button/animated-record-button';
import { useLlmContext } from '../../ai/context/llm.context';
import { useAiTransaction } from '../../ai/hook/use-ai-transaction.hook';
import { useStreamingTranscribe } from '../../ai/hook/use-streaming-transcribe.hook';
import { useSettingsContext } from '../../settings/context/settings.context';
import { AiTransactionPreviewCard } from '../../transaction/components/ai-transaction-preview-card/ai-transaction-preview-card';
import { useCreateExpenseTransactionMutation } from '../../transaction/hook/use-create-expense-transaction.mutation';

const SCROLL_VIEW_CONTENT_STYLE = { paddingBottom: 180 };

// eslint-disable-next-line max-lines-per-function
export default function AiScreen() {
    const { t } = useLingui();
    const { llm, isSttReady, sttDownloadProgress } = useLlmContext();
    const { defaultAccount } = useSettingsContext();
    const createExpense = useCreateExpenseTransactionMutation();

    const [finalPrompt, setFinalPrompt] = useState('');
    const [error, setError] = useState('');
    const [accountId, setAccountId] = useState<number | null>(null);
    const hasAutoStartedRef = useRef(false);

    const [systemPrompt, transactionInfo, resetTransaction, setTransactionCategory] = useAiTransaction(llm, finalPrompt);

    const selectedAccountId = accountId ?? defaultAccount?.id ?? null;

    const handleTranscriptionComplete = async (transcribed: string) => {
        setFinalPrompt(transcribed);

        if (isNotEmptyString(transcribed)) {
            try {
                await llm.generate([
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: transcribed }
                ]);
            } catch (e: unknown) {
                setError(getErrorMessage(e));
            }
        } else {
            setError(t`No speech detected`);
        }
    };

    const { startRecording, stopRecording, status, transcription, audioLevel } =
        useStreamingTranscribe(handleTranscriptionComplete);

    const isReady = llm.isReady && isSttReady;

    useEffect(() => {
        if (isReady && !hasAutoStartedRef.current) {
            hasAutoStartedRef.current = true;
            startRecording();
        }
    }, [isReady, startRecording]);

    const handleConfirm = async () => {
        if (!isPositiveNumber(transactionInfo?.amount)) {return;}
        await createExpense(transactionInfo.amount, transactionInfo.category?.id ?? 0, selectedAccountId);
        resetTransaction();
        setAccountId(null);
    };

    const handleCancel = () => {
        setError('');
        setFinalPrompt('');
        resetTransaction();
        setAccountId(null);
    };

    const handleRecord = () => {
        if (status === 'idle') {
            handleCancel();
            startRecording();
        } else {
            stopRecording();
        }
    };

    const downloadProgress = Math.min(llm.downloadProgress, sttDownloadProgress);
    const showTransactionCard = isDefined(transactionInfo) && isPositiveNumber(transactionInfo.amount);

    const getButtonState = () => {
        if (!isReady) {return 'loading' as const;}
        if (status === 'recording') {return 'recording' as const;}
        if (status === 'processing') {return 'transcribing' as const;}
        if (llm.isGenerating) {return 'thinking' as const;}

        return 'idle' as const;
    };

    const hasTranscription = isNotEmptyString(transcription.committed) || isNotEmptyString(transcription.partial);

    return (
        <BottomSheetsProvider>
            <Page>
                <ScrollView className="flex-1 px-4" contentContainerStyle={SCROLL_VIEW_CONTENT_STYLE}>
                    {hasTranscription && (
                        <View className="mt-4 p-4 bg-secondary rounded-2xl">
                            <Text className="text-secondary text-sm font-medium mb-2">{t`Your message:`}</Text>
                            <Text className="text-primary text-base">
                                {transcription.committed}
                                {isNotEmptyString(transcription.partial) && (
                                    <Text className="text-secondary-foreground italic">{transcription.partial}</Text>
                                )}
                            </Text>
                        </View>
                    )}
                    {isNotEmptyString(error) && (
                        <View className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 rounded-2xl">
                            <Text className="text-red-600 dark:text-red-400 text-base">{error}</Text>
                        </View>
                    )}
                    {showTransactionCard && (
                        <AiTransactionPreviewCard
                            amount={transactionInfo.amount}
                            category={transactionInfo.category}
                            type={transactionInfo.type}
                            accountId={selectedAccountId}
                            onConfirm={handleConfirm}
                            onCancel={handleCancel}
                            onCategoryChange={setTransactionCategory}
                            onAccountChange={setAccountId}
                        />
                    )}
                </ScrollView>
                <View className="absolute bottom-8 left-0 right-0 items-center">
                    <AnimatedRecordButton
                        state={getButtonState()}
                        audioLevel={audioLevel}
                        downloadProgress={downloadProgress}
                        onPress={handleRecord}
                    />
                </View>
            </Page>
        </BottomSheetsProvider>
    );
}
