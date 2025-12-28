import { useLingui } from '@lingui/react/macro';
import { useRef } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ImportColumnMapperBottomSheet } from '../import-column-mapper-bottom-sheet/import-column-mapper-bottom-sheet';

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
    const ref = useRef<BottomSheetInterface | null>(null);

    const hasValue = isNotEmptyString(value);

    const handleOpen = () => void ref.current?.open();

    const variant = hasError ? 'destructive' : 'primary';

    const title = hasValue ? value : '';
    const description = hasValue ? '' : t`Select column...`;

    return (
        <>
            <SimpleHorizontalCell size="md" variant={variant} onPress={handleOpen} title={title} description={description} />

            <ImportColumnMapperBottomSheet
                ref={ref}
                headers={headers}
                selectedHeaders={selectedHeaders}
                currentValue={value}
                fieldLabel={fieldLabel}
                onSelect={onSelect}
                onClear={onClear}
            />
        </>
    );
};
