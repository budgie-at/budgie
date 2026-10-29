import type { BinanceSyncTokenSectionActionTypeEnum } from '../enum/binance-sync-token-section-action-type.enum';

export type BinanceSyncTokenSectionActionInterface =
    | { readonly type: BinanceSyncTokenSectionActionTypeEnum.EDIT_STARTED; readonly apiKey: string; readonly apiSecret: string }
    | { readonly type: BinanceSyncTokenSectionActionTypeEnum.API_KEY_CHANGED; readonly apiKey: string }
    | { readonly type: BinanceSyncTokenSectionActionTypeEnum.API_SECRET_CHANGED; readonly apiSecret: string }
    | { readonly type: BinanceSyncTokenSectionActionTypeEnum.EDIT_FINISHED };
