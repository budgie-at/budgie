import { TransactionEntryTypeEnum } from '@budgie/contracts';

import { buildPrimaryEntry } from '../../core/utils/build-primary-entry.util';

import type { InzhurTradeInterface } from '../interface/inzhur-trade.interface';

export const buildInzhurTradeEntries = ({ isSell, externalId, cashAccountId, fundAccountId, cashAmount, quantity }: InzhurTradeInterface) =>
    isSell
        ? [
              buildPrimaryEntry(fundAccountId, TransactionEntryTypeEnum.CREDIT, quantity, externalId),
              buildPrimaryEntry(cashAccountId, TransactionEntryTypeEnum.DEBIT, cashAmount, externalId)
          ]
        : [
              buildPrimaryEntry(cashAccountId, TransactionEntryTypeEnum.CREDIT, cashAmount, externalId),
              buildPrimaryEntry(fundAccountId, TransactionEntryTypeEnum.DEBIT, quantity, externalId)
          ];
