import { useLingui } from '@lingui/react/macro';

import { Button } from '../button/button';

interface Props {
    readonly onPress: () => void;
}

export const ModalFormCancelButton = ({ onPress }: Props) => {
    const { t } = useLingui();

    return <Button className="flex-1" variant="ghost" onPress={onPress} content={t`Cancel`} />;
};
