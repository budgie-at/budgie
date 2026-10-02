import { GenerateResponseFormatInterface } from './generate-response-format.interface';

export interface GenerateOptionsInterface {
    readonly maxNewTokens?: number;
    readonly responseFormat?: GenerateResponseFormatInterface;
    readonly temperature?: number;
    readonly throwOnInterrupt?: boolean;
}
