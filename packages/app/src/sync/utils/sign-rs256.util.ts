import * as Effect from 'effect/Effect';

import { EnableBankingSetupErrorReasonEnum } from '../enum/enable-banking-setup-error-reason.enum';
import { EnableBankingSetupError } from '../error/enable-banking-setup.error';

export const signRs256 = (privateKeyPem: string, signingInput: string) =>
    Effect.promise(() => import('node-forge')).pipe(
        Effect.flatMap(({ md, pki, util }) =>
            Effect.try({
                try: () =>
                    util
                        .encode64(pki.privateKeyFromPem(privateKeyPem).sign(md.sha256.create().update(signingInput, 'utf8')))
                        .replaceAll('+', '-')
                        .replaceAll('/', '_')
                        .replaceAll('=', ''),
                catch: () => EnableBankingSetupError.make({ reason: EnableBankingSetupErrorReasonEnum.INVALID_FORMAT })
            })
        )
    );
