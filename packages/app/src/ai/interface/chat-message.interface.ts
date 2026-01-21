export interface ChatMessageInterface {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
