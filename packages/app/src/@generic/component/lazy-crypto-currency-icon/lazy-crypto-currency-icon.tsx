import { lazy } from 'react';

export const LazyCryptoCurrencyIcon = lazy(() =>
    import('../crypto-currency-icon/crypto-currency-icon').then(module => ({ default: module.CryptoCurrencyIcon }))
);
