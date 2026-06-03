const ATM_FEE_TRANSACTION_EXTERNAL_ID_PREFIX = 'atm-fee:';

export const buildAtmFeeTransactionExternalId = (canonicalTransactionId: number): string =>
    `${ATM_FEE_TRANSACTION_EXTERNAL_ID_PREFIX}${canonicalTransactionId}`;
