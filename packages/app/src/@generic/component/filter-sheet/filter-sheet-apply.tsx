import { useLingui } from '@lingui/react/macro';

import { EmptyFn, isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../button/button';

interface Props {
    readonly onApply: EmptyFn;
    readonly selectedCount?: number;
    readonly testID?: string;
}

export const FilterSheetApply = ({ onApply, selectedCount = 0, testID }: Props) => {
    const { t } = useLingui();
    const content = isPositiveNumber(selectedCount) ? t`Apply Filter (${selectedCount})` : t`Apply Filter`;

    return <Button variant="ghost" onPress={onApply} content={content} testID={testID} />;
};
