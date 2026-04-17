import { GenerateOptionsInterface } from '../../@generic/interface/generate-options.interface';

export interface ChatInvokerInterface {
    readonly isReady: boolean;
    generate(systemPrompt: string, userMessage: string, options?: GenerateOptionsInterface): Promise<string>;
    interrupt(): void;
}
