import { useLingui } from '@lingui/react/macro';

import { isPositiveNumber } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { Footer } from '../../../@generic/component/footer/footer';

interface Props {
    readonly selectedTagsCount: number;
    readonly onClose: () => void;
}

export const TagsSelectorFooter = ({ selectedTagsCount, onClose }: Props) => {
    const { t } = useLingui();
    const buttonText = isPositiveNumber(selectedTagsCount) ? t`Done (${selectedTagsCount})` : t`Done`;

    return (
        <Footer>
            <Button size="md" variant="ghost" content={buttonText} onPress={onClose} />
        </Footer>
    );
};
