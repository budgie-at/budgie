import { Trans } from '@lingui/react/macro';

import { Button } from '../button/button';

interface Props {
    readonly onPress: () => void;
}

export const ModalFormCancelButton = ({ onPress }: Props) => (
    <Button className="flex-1" variant="ghost" onPress={onPress} content={<Trans>Cancel</Trans>} />
);
