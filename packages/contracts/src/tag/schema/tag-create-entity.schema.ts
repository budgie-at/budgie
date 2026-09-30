import * as Schema from 'effect/Schema';

import { TAG_TITLE_MAX_LENGTH } from '../constant/tag-title-max-length.constant';
import { TAG_TITLE_MIN_LENGTH } from '../constant/tag-title-min-length.constant';

export const TagCreateEntitySchema = Schema.Struct({
    title: Schema.Trim.check(Schema.isMinLength(TAG_TITLE_MIN_LENGTH), Schema.isMaxLength(TAG_TITLE_MAX_LENGTH))
});
