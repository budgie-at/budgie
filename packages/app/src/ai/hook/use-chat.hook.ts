import { useSyncExternalStore } from 'react';

import { ChatSnapshotInterface } from '../interface/chat-snapshot.interface';
import { chatService } from '../service/chat.service';

export const useChat = (): ChatSnapshotInterface => useSyncExternalStore(chatService.subscribe, chatService.getSnapshot);
