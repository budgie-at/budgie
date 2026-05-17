import { isNull } from 'drizzle-orm';

import { LanguageEnum } from '../../@generic/enum/language.enum';
import { buildTranslatedCategoryRelation } from '../../@generic/util/build-translated-category-relation.util';
import { AccountAssociationEnum } from '../../account/enum/account-association.enum';
import { TransactionEntryAssociationEnum } from '../../transaction-entry/enum/transaction-entry-association.enum';
import { TransactionEntryEntityTable } from '../../transaction-entry/table/transaction-entry-entity.table';
import { TransactionTagsAssociationEnum } from '../../transaction-tags/enum/transaction-tags-association.enum';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

export const buildTransactionFullRelations = (language: LanguageEnum) =>
    ({
        [TransactionAssociationEnum.ENTRIES]: {
            where: isNull(TransactionEntryEntityTable.originalTransactionId),
            with: {
                [TransactionEntryAssociationEnum.ACCOUNT]: {
                    with: {
                        [AccountAssociationEnum.INSTRUMENT]: true
                    }
                },
                [TransactionEntryAssociationEnum.CATEGORY]: buildTranslatedCategoryRelation(language),
                [TransactionEntryAssociationEnum.MCC_CATEGORY]: true
            }
        },
        [TransactionAssociationEnum.TRANSACTION_TAGS]: {
            with: {
                [TransactionTagsAssociationEnum.TAG]: true
            }
        },
        [TransactionAssociationEnum.FROM_ACCOUNT]: true,
        [TransactionAssociationEnum.TO_ACCOUNT]: true
    }) as const;
