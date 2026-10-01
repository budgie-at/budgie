import type { EffectSqliteClientOptionsInterface } from './effect-sqlite-client-options.interface';
import type { EffectCacheShape } from 'drizzle-orm/cache/core/cache-effect';
import type { EffectLoggerShape } from 'drizzle-orm/effect-core';

export interface EffectSqliteClientSessionOptionsInterface extends EffectSqliteClientOptionsInterface {
    readonly logger: EffectLoggerShape;
    readonly cache: EffectCacheShape;
}
