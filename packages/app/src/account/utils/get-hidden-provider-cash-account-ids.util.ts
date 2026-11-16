import { isFiatAccount } from './is-fiat-account.util';
import { isShownHomeHolding } from './is-shown-home-holding.util';

import type { HomeAccountBalanceInterface } from '../interface/home-account-balance.interface';
import type { AccountAssociationEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';

export const getHiddenProviderCashAccountIds = (
    holdingProviders: readonly {
        readonly accounts: readonly Pick<AccountWithInstrumentEntityInterface, 'id' | AccountAssociationEnum.INSTRUMENT>[];
    }[],
    balancesByAccountId: ReadonlyMap<number, Pick<HomeAccountBalanceInterface, 'balance' | 'convertedBalance' | 'isValued'>>,
    decimalPlaces: number
): ReadonlySet<number> =>
    new Set(
        holdingProviders.flatMap(({ accounts }) => {
            const hasShownPosition = accounts
                .filter(account => !isFiatAccount(account))
                .some(account => {
                    const accountBalance = balancesByAccountId.get(account.id);

                    return isShownHomeHolding(
                        {
                            balance: accountBalance?.balance ?? 0,
                            value: accountBalance?.convertedBalance ?? 0,
                            isValued: accountBalance?.isValued === true
                        },
                        decimalPlaces
                    );
                });

            return hasShownPosition
                ? accounts
                      .filter(account => isFiatAccount(account) && balancesByAccountId.get(account.id)?.balance === 0)
                      .map(account => account.id)
                : [];
        })
    );
