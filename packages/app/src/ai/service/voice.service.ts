import { VoiceLlmService } from '@budgie/ai';

import { chatService } from './chat.service';

export const voiceService = new VoiceLlmService(chatService);
