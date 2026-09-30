import * as Context from 'effect/Context';

import type { EmbeddingInvokerInterface } from '../interface/embedding-invoker.interface';

export class EmbeddingInvoker extends Context.Service<EmbeddingInvoker, EmbeddingInvokerInterface>()('@budgie/ai/EmbeddingInvoker') {}
