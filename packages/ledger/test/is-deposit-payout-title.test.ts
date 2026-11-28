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
        'Cancelación de plazo fijo 12 meses',
        'Remboursement du compte à terme',
        'Cancelación de depósito',
        'Deposit payout principal and interest',
        'Виплата депозиту: тіло та відсотки',
        'Festgeldauszahlung Kapital und Zinsen'
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
        'Zinsen Festgeld',
        'Matured deposit interest',
        'Cancelación de depósito en garantía',
        'Festgeldauszahlung Zinsgutschrift',
        'Interest on deposit maturity'
    ])('ignores the unrelated income "%s"', title => {
        expect(isDepositPayoutTitle(title)).toBe(false);
    });
});
