import { EnableBankingTokenSchema } from '@budgie/sync';
import * as Schema from 'effect/Schema';

export const decodeEnableBankingToken = Schema.decodeUnknownOption(Schema.fromJsonString(EnableBankingTokenSchema));
