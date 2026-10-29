import type { CreateBinanceAccountActionTypeEnum } from '../enum/create-binance-account-action-type.enum';
import type { SyncAccountPreviewInterface } from '@budgie/sync';

export type CreateBinanceAccountActionInterface =
    | { readonly type: CreateBinanceAccountActionTypeEnum.API_KEY_CHANGED; readonly apiKey: string }
    | { readonly type: CreateBinanceAccountActionTypeEnum.API_SECRET_CHANGED; readonly apiSecret: string }
    | {
          readonly type: CreateBinanceAccountActionTypeEnum.ACCOUNTS_FETCHED;
          readonly parkedPreviews: readonly SyncAccountPreviewInterface[];
      };
