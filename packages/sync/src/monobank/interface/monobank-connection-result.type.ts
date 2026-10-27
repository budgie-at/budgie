import type { SyncAccountPreviewInterface } from '../../core/interface/sync-account-preview.interface';
import type { MonobankConnectionResultEnum } from '../enum/monobank-connection-result.enum';

export type MonobankConnectionResultType =
    | { readonly kind: MonobankConnectionResultEnum.PREVIEWS; readonly previews: SyncAccountPreviewInterface[] }
    | { readonly kind: MonobankConnectionResultEnum.TOKEN_ROTATED; readonly integrationId: number };
