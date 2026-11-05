import type { useGetAccountByIdQuery } from '../../account/query/use-get-account-by-id.query';
import type { useCurrencyConversion } from '../hook/use-currency-conversion.hook';
import type { useKeypadInput } from '../hook/use-keypad-input.hook';

export interface ConvertTransferFormResultInterface {
    readonly originalAccount: ReturnType<typeof useGetAccountByIdQuery>['account'];
    readonly fromAccount: ReturnType<typeof useGetAccountByIdQuery>['account'];
    readonly counterAccount: ReturnType<typeof useGetAccountByIdQuery>['account'];
    readonly isEditing: boolean;
    readonly conversion: ReturnType<typeof useCurrencyConversion>;
    readonly keypad: ReturnType<typeof useKeypadInput>;
    readonly handleEdit: () => void;
    readonly handleConfirm: () => void;
}
