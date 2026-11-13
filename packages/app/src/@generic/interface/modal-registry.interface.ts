import type { AccountSelectorCreateActionInterface } from '../../account/interface/account-selector-create-action.interface';
import type { CategoryDestinationParamsInterface } from '../../category/interface/category-destination-params.interface';
import type { CategoryFormResultInterface } from '../../category/interface/category-form-result.interface';
import type { ConvertToInstallmentModalParamsInterface } from '../../installment-plan/interface/convert-to-installment-modal-params.interface';
import type { RulePrefillDataInterface } from '../../rule/interface/rule-prefill-data.interface';
import type { RuleSelectorOptionInterface } from '../../rule/interface/rule-selector-option.interface';
import type { TagDestinationParamsInterface } from '../../tag/interface/tag-destination-params.interface';
import type { TagFormResultInterface } from '../../tag/interface/tag-form-result.interface';
import type { ConsolidationSourceModalParamsInterface } from '../../transaction/interface/consolidation-source-modal-params.interface';
import type { ConvertToRefundModalParamsInterface } from '../../transaction/interface/convert-to-refund-modal-params.interface';
import type { TransactionIdsFilterResultInterface } from '../../transaction/interface/transaction-ids-filter-result.interface';
import type { Contact } from '../hook/use-contacts.hook';
import type { ColorPaletteVariant } from '../type/color-palette-variant.type';
import type { AnchoredMorphOriginInterface } from './anchored-morph-origin.interface';
import type { AITransactionInterface } from '@budgie/ai';
import type {
    AccountDebtTypeEnum,
    AccountTypeEnum,
    AmountRangeInterface,
    CategoryEntityInterface,
    DateRangeInterface,
    InstrumentTypeEnum,
    LanguageEnum,
    TagEntityInterface,
    TransactionEntryCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    UserIconNameEnum,
    UserIconType
} from '@budgie/contracts';
import type { YahooListingInterface } from '@budgie/market';

export interface ModalRegistryInterface {
    readonly '/account-selector': {
        readonly params: {
            readonly initialAccountId?: number | null;
            readonly debtType?: AccountDebtTypeEnum;
            readonly excludeAccountId?: number | null;
            readonly excludeAccountTypes?: AccountTypeEnum[];
            readonly includeAccountTypes?: AccountTypeEnum[];
            readonly emptyStateDescription?: string;
            readonly onlyActive?: boolean;
            readonly showDebtTotal?: boolean;
            readonly createAction?: AccountSelectorCreateActionInterface;
            readonly origin?: AnchoredMorphOriginInterface;
        };
        readonly result: number;
    };
    readonly '/bank-integration-key': { readonly params: number; readonly result: null };
    readonly '/category-destination': { readonly params: CategoryDestinationParamsInterface; readonly result: number };
    readonly '/category-form': {
        readonly params: { readonly category?: CategoryEntityInterface; readonly defaultTitle?: string; readonly syncZone?: string };
        readonly result: CategoryFormResultInterface;
    };
    readonly '/category-selector': {
        readonly params: {
            readonly initialCategoryId?: number | null;
            readonly excludeCategoryIds?: number[];
            readonly syncZone?: string;
            readonly variant?: ColorPaletteVariant;
            readonly title?: string;
            readonly description?: string;
        };
        readonly result: number;
    };
    readonly '/consolidation-source': { readonly params: ConsolidationSourceModalParamsInterface; readonly result: null };
    readonly '/contact-selector': { readonly params: { readonly selectedContactId: string | null }; readonly result: Contact };
    readonly '/convert-to-installment': { readonly params: ConvertToInstallmentModalParamsInterface; readonly result: number };
    readonly '/convert-to-refund': { readonly params: ConvertToRefundModalParamsInterface; readonly result: number };
    readonly '/convert-to-transfer': {
        readonly params: {
            readonly transactionId: number;
            readonly transactionType: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
            readonly excludeAccountId: number;
            readonly sourceAmount: number;
            readonly sourceInstrumentId: number;
            readonly sourceCode: string;
            readonly skipPostConvertNavigation?: boolean;
        };
        readonly result: boolean;
    };
    readonly '/currency-selector': {
        readonly params: {
            readonly selectedInstrumentId?: number;
            readonly instrumentType?: InstrumentTypeEnum;
            readonly origin?: AnchoredMorphOriginInterface;
        };
        readonly result: number;
    };
    readonly '/date-filter': {
        readonly params: { readonly value: DateRangeInterface | null };
        readonly result: { readonly value: DateRangeInterface | null };
    };
    readonly '/date-picker': { readonly params: { readonly initialDate?: Date }; readonly result: Date };
    readonly '/icon-selector': {
        readonly params: {
            readonly selectedIcon?: UserIconType;
            readonly keywords?: string[];
            readonly excludedIcons?: readonly UserIconNameEnum[];
        };
        readonly result: UserIconType;
    };
    readonly '/import-backup-pin': { readonly params: string; readonly result: string };
    readonly '/import-column-mapper': {
        readonly params: {
            readonly samples: Record<string, readonly string[]>;
            readonly headers: string[];
            readonly selectedHeaders: string[];
            readonly currentValue: string | undefined;
            readonly fieldLabel: string;
            readonly isRequired?: boolean;
        };
        readonly result: { readonly type: 'select'; readonly header: string } | { readonly type: 'clear' };
    };
    readonly '/language-selector': {
        readonly params: { readonly selectedLanguage: LanguageEnum; readonly origin?: AnchoredMorphOriginInterface };
        readonly result: LanguageEnum;
    };
    readonly '/resync-window-picker': { readonly params: { readonly accountId: number }; readonly result: null };
    readonly '/rule-form': {
        readonly params: { readonly ruleId?: number; readonly prefillData?: RulePrefillDataInterface };
        readonly result: 'created' | 'updated' | 'deleted';
    };
    readonly '/rule-mcc-selector': { readonly params: { readonly selectedMcc: string | null }; readonly result: string };
    readonly '/rule-selector': {
        readonly params: {
            readonly title: string;
            readonly options: readonly RuleSelectorOptionInterface[];
            readonly selectedValue: string | null;
        };
        readonly result: string;
    };
    readonly '/security-selector': {
        readonly params: { readonly selectedSymbol: string | null };
        readonly result: YahooListingInterface;
    };
    readonly '/split-entries': {
        readonly params: {
            readonly entries: TransactionEntryCreateInputInterface[];
            readonly variant: ColorPaletteVariant;
            readonly entryType: TransactionEntryTypeEnum;
            readonly currencySymbol: string;
            readonly totalAmount: number;
        };
        readonly result: TransactionEntryCreateInputInterface[];
    };
    readonly '/tag-destination': { readonly params: TagDestinationParamsInterface; readonly result: number[] };
    readonly '/tag-form': {
        readonly params: { readonly tag?: TagEntityInterface; readonly defaultTitle?: string };
        readonly result: TagFormResultInterface;
    };
    readonly '/tags-selector': {
        readonly params: {
            readonly initialTagIds?: number[];
            readonly suggestedTagIds?: number[];
            readonly excludeTagIds?: number[];
            readonly title?: string;
            readonly description?: string;
            readonly singleSelect?: boolean;
            readonly enablePrimarySelection?: boolean;
        };
        readonly result: number[];
    };
    readonly '/transaction-account-filter': {
        readonly params: { readonly value: number[] | null };
        readonly result: TransactionIdsFilterResultInterface;
    };
    readonly '/transaction-amount-filter': {
        readonly params: { readonly value: AmountRangeInterface | null };
        readonly result: { readonly value: AmountRangeInterface | null };
    };
    readonly '/transaction-category-filter': ModalRegistryInterface['/transaction-account-filter'];
    readonly '/transaction-fee': {
        readonly params: {
            readonly accountId: number;
            readonly currencySymbol: string;
            readonly entry: TransactionEntryCreateInputInterface | null;
            readonly variant: ColorPaletteVariant;
        };
        readonly result: readonly TransactionEntryCreateInputInterface[];
    };
    readonly '/transaction-tag-filter': ModalRegistryInterface['/transaction-account-filter'];
    readonly '/transaction-type-filter': {
        readonly params: { readonly value: TransactionTypeEnum[] | null };
        readonly result: { readonly value: TransactionTypeEnum[] | null };
    };
    readonly '/voice-review': {
        readonly params: { readonly transactions: AITransactionInterface[]; readonly originalText: string };
        readonly result:
            | { readonly kind: 'saved'; readonly transactionIds: number[]; readonly accountId: number }
            | { readonly kind: 're-record' }
            | { readonly kind: 'cancelled' };
    };
}
