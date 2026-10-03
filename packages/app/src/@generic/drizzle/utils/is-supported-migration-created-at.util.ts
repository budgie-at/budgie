import { isDefined } from '@rnw-community/shared';

const LAST_LEGACY_MIGRATION_CREATED_AT = 1790707597573;

export const isSupportedMigrationCreatedAt = (lastCreatedAt: number | null): boolean =>
    isDefined(lastCreatedAt) && lastCreatedAt >= LAST_LEGACY_MIGRATION_CREATED_AT;
