import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';

interface Props {
    readonly selectedCount: number;
    readonly onApply: () => void;
    readonly applyButtonTestID?: string;
}

export const SearchableFilterFooter = ({ selectedCount, onApply, applyButtonTestID }: Props) => {
    const { t } = useLingui();

    const buttonText = isPositiveNumber(selectedCount) ? t`Apply Filter (${selectedCount})` : t`Apply Filter`;

    return (
        <Footer>
            <Button variant="ghost" onPress={onApply} content={buttonText} testID={applyButtonTestID} />
        </Footer>
    );
};
