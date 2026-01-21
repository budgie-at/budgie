import { ReactNode, useState } from 'react';

import { LlmContext, LlmContextInterface } from '../context/llm.context';

import { lfm25InferenceService } from './lfm25-inference.service';
import { lfm25TokenizerService } from './lfm25-tokenizer.service';
import { ChatMessage } from './use-onnx-llm.hook';

interface Props {
    readonly modelPath: string;
    readonly children: ReactNode;
}

interface OnnxLlmState {
    isReady: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    error: string | null;
    messageHistory: ChatMessage[];
    response: string;
}

interface OnnxLlmInstance {
    isReady: boolean;
    isGenerating: boolean;
    downloadProgress: number;
    error: string | null;
    messageHistory: ChatMessage[];
    response: string;
    configure: (config: { chatConfig: { systemPrompt: string; initialMessageHistory: ChatMessage[] } }) => void;
    sendMessage: (message: string) => Promise<void>;
    interrupt: () => void;
}

const DEFAULT_MAX_TOKENS = 256;
const DEFAULT_TEMPERATURE = 0.05;
const DEFAULT_TOP_K = 50;
const DEFAULT_REPETITION_PENALTY = 1.05;

const createOnnxLlmInstance = (
    state: OnnxLlmState,
    setState: React.Dispatch<React.SetStateAction<OnnxLlmState>>,
    modelPath: string
): OnnxLlmInstance => {
    let systemPrompt = '';
    let initialHistory: ChatMessage[] = [];
    let isConfigured = false;

    const loadModels = async (): Promise<void> => {
        try {
            setState(prev => ({ ...prev, downloadProgress: 10 }));
            await lfm25TokenizerService.load();
            setState(prev => ({ ...prev, downloadProgress: 30 }));

            await lfm25InferenceService.load(modelPath);
            setState(prev => ({ ...prev, downloadProgress: 100, isReady: true, error: null }));
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setState(prev => ({ ...prev, error: errorMessage, isReady: false }));
        }
    };

    const configure = (config: { chatConfig: { systemPrompt: string; initialMessageHistory: ChatMessage[] } }): void => {
        systemPrompt = config.chatConfig.systemPrompt;
        initialHistory = config.chatConfig.initialMessageHistory;
        setState(prev => ({ ...prev, messageHistory: initialHistory }));
        isConfigured = true;

        if (!lfm25TokenizerService.isLoaded || !lfm25InferenceService.isLoaded) {
            loadModels().catch(console.error);
        }
    };

    const sendMessage = async (message: string): Promise<void> => {
        if (!state.isReady || !isConfigured) {
            throw new Error('Model not ready or not configured');
        }

        setState(prev => ({ ...prev, isGenerating: true, error: null, response: '' }));

        try {
            const userMessage: ChatMessage = { role: 'user', content: message };
            const messagesWithSystem: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...state.messageHistory, userMessage];

            const prompt = lfm25TokenizerService.buildChatPrompt(messagesWithSystem);
            const inputIds = await lfm25TokenizerService.encode(prompt);
            const specialTokens = lfm25TokenizerService.getSpecialTokens();

            const generatedTokens = await lfm25InferenceService.generate(inputIds, {
                maxNewTokens: DEFAULT_MAX_TOKENS,
                temperature: DEFAULT_TEMPERATURE,
                topK: DEFAULT_TOP_K,
                repetitionPenalty: DEFAULT_REPETITION_PENALTY,
                eosTokenId: specialTokens.eosToken
            });

            const response = await lfm25TokenizerService.decode(generatedTokens);
            const cleanResponse = response.replace(/<\|im_end\|>/gu, '').trim();

            const assistantMessage: ChatMessage = { role: 'assistant', content: cleanResponse };

            setState(prev => ({
                ...prev,
                messageHistory: [...prev.messageHistory, userMessage, assistantMessage],
                response: cleanResponse,
                isGenerating: false
            }));
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            setState(prev => ({ ...prev, error: errorMessage, isGenerating: false }));
            throw e;
        }
    };

    const interrupt = (): void => {
        lfm25InferenceService.interrupt();
        setState(prev => ({ ...prev, isGenerating: false }));
    };

    return {
        get isReady() {
            return state.isReady;
        },
        get isGenerating() {
            return state.isGenerating;
        },
        get downloadProgress() {
            return state.downloadProgress;
        },
        get error() {
            return state.error;
        },
        get messageHistory() {
            return state.messageHistory;
        },
        get response() {
            return state.response;
        },
        configure,
        sendMessage,
        interrupt
    };
};

interface SttInstance {
    isReady: boolean;
    isGenerating: boolean;
    error: string | null;
    downloadProgress: number;
    committedTranscription: string;
    nonCommittedTranscription: string;
    encode: (waveform: number[] | Float32Array) => Promise<Float32Array>;
    decode: (tokens: Float32Array) => Promise<string>;
    configure: () => void;
    transcribe: (waveform: number[] | Float32Array) => Promise<string>;
    stream: (waveform: number[] | Float32Array) => Promise<string>;
    streamStart: () => void;
    streamStop: () => void;
    streamInsert: (waveform: number[] | Float32Array) => void;
}

const createDisabledSttInstance = (): SttInstance => ({
    isReady: false,
    isGenerating: false,
    error: 'STT not available with ONNX provider',
    downloadProgress: 0,
    committedTranscription: '',
    nonCommittedTranscription: '',
    encode: async () => new Float32Array(),
    decode: async () => '',
    configure: () => void 0,
    transcribe: async () => '',
    stream: async () => '',
    streamStart: () => void 0,
    streamStop: () => void 0,
    streamInsert: () => void 0
});

export const OnnxLlmProvider = ({ modelPath, children }: Props) => {
    const [state, setState] = useState<OnnxLlmState>({
        isReady: false,
        isGenerating: false,
        downloadProgress: 0,
        error: null,
        messageHistory: [],
        response: ''
    });

    const llmInstance = createOnnxLlmInstance(state, setState, modelPath);
    const sttInstance = createDisabledSttInstance();

    const value: LlmContextInterface = {
        isAvailable: true,
        llm: llmInstance as LlmContextInterface['llm'],
        stt: sttInstance as unknown as LlmContextInterface['stt']
    };

    return <LlmContext.Provider value={value}>{children}</LlmContext.Provider>;
};
