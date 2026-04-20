import { useSyncExternalStore } from 'react';

import { LlamaSubsystemSnapshotInterface } from '../interface/llama-subsystem-snapshot.interface';
import { chatService } from '../service/chat.service';

export const useChat = (): LlamaSubsystemSnapshotInterface => useSyncExternalStore(chatService.subscribe, chatService.getSnapshot);
