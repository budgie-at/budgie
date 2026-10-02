import * as Context from 'effect/Context';

import type { ChatInvokerInterface } from '../interface/chat-invoker.interface';

export class ChatInvoker extends Context.Service<ChatInvoker, ChatInvokerInterface>()('@budgie/ai/ChatInvoker') {}
