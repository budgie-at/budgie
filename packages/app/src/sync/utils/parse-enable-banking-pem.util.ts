import * as Effect from 'effect/Effect';
import { pki } from 'node-forge';

import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';

const ENCRYPTED_MARKER = /ENCRYPTED/u;

export const parseEnableBankingPem = (text: string) =>
    Effect.try({
        try: () => pki.privateKeyToPem(pki.privateKeyFromPem(text.trim())),
        catch: () =>
            EnableBankingSetupError.make({
                reason: ENCRYPTED_MARKER.test(text)
                    ? EnableBankingSetupErrorReasonEnum.ENCRYPTED
                    : EnableBankingSetupErrorReasonEnum.INVALID_FORMAT
            })
    });
