import { useLingui } from '@lingui/react/macro';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { useImportColumnMapperModal } from '../../context/import-column-mapper-modal.context';

interface Props {
    readonly value: string | undefined;
    readonly headers: string[];
    readonly selectedHeaders: string[];
    readonly fieldLabel: string;
    readonly onSelect: (header: string) => void;
    readonly hasError?: boolean;
    readonly onClear: () => void;
}

export const ImportColumnMapper = ({ value, headers, selectedHeaders, fieldLabel, onSelect, onClear, hasError = false }: Props) => {
    const { t } = useLingui();
    const { openImportColumnMapper } = useImportColumnMapperModal();

    const hasValue = isNotEmptyString(value);

    const handleOpen = async () => {
        const result = await openImportColumnMapper({ headers, selectedHeaders, currentValue: value, fieldLabel });

        if (isDefined(result)) {
            if (result.type === 'select') {
                onSelect(result.header);
            }

            if (result.type === 'clear') {
                onClear();
            }
        }
    };

    const variant = hasError ? 'destructive' : 'primary';

    const title = hasValue ? value : '';
    const description = hasValue ? '' : t`Select column...`;

    return <SimpleHorizontalCell size="md" variant={variant} onPress={handleOpen} title={title} description={description} />;
};
