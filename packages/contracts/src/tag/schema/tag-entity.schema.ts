import { array, string } from 'zod';

import { BaseEntitySchema } from '../../generic/schema/base-entity.schema';
import { TransactionEntitySchema } from '../../transaction/schema/transaction-entity.schema';
import { TAG_TITLE_MAX_LENGTH } from '../constant/tag-title-max-length.constant';
import { TagAssociationEnum } from '../enum/tag-association.enum';

export const TagEntitySchema = BaseEntitySchema.extend({
    title: string().max(TAG_TITLE_MAX_LENGTH).describe('Title of the tag.'),

    get [TagAssociationEnum.TRANSACTIONS]() {
        return array(TransactionEntitySchema).describe('Transactions associated with the tag.');
    }
});
