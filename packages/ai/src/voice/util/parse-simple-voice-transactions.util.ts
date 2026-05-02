import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { ExtractedVoiceTransactionInterface } from '../interface/extracted-voice-transaction.interface';

import { parseVoiceSegment } from './parse-voice-segment.util';

const ITEM_SEPARATOR_PATTERN = /[,;]+|\s+(?:і|та|and)\s+/iu;

export const parseSimpleVoiceTransactions = (text: string): ExtractedVoiceTransactionInterface[] =>
    text
        .split(ITEM_SEPARATOR_PATTERN)
        .map(segment => segment.trim())
        .filter(isNotEmptyString)
        .map(parseVoiceSegment)
        .filter(isDefined);
