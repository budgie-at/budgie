import { describe, expect, it } from '@effect/vitest';

import { isDepositPayoutTitle } from '../src/account/utils/is-deposit-payout-title.util';

describe('isDepositPayoutTitle', () => {
    it.each([
        'Term deposit maturity',
        'DEPOSIT PAYOUT 12345',
        'Échéance compte à terme',
        'Remboursement dépôt à terme n°42',
        'Виплата депозиту',
        'Закриття вкладу',
        'Festgeldauszahlung',
        'Rückzahlung Festgeld 12 Monate',
        'Vencimiento plazo fijo',
        'Cancelación de depósito'
    ])('recognises the deposit payout "%s"', title => {
        expect(isDepositPayoutTitle(title)).toBe(true);
    });

    it.each([
        'Deposit refund',
        'Cash deposit',
        'Remboursement dépôt de garantie',
        'Kaution Rückzahlung',
        'Devolución fianza',
        'Повернення депозиту за оренду',
        'Виплата відсотків за депозитом',
        'Zinsen Festgeld'
    ])('ignores the unrelated income "%s"', title => {
        expect(isDepositPayoutTitle(title)).toBe(false);
    });
});
