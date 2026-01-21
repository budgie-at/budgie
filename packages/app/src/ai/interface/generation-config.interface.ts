export interface GenerationConfigInterface {
    maxNewTokens: number;
    temperature: number;
    topK: number;
    topP: number;
    repetitionPenalty: number;
    eosTokenId: number;
}
