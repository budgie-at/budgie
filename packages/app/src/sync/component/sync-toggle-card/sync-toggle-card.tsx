import { useLingui } from '@lingui/react/macro';

import { SimpleHorizontalCell } from '../../../@generic/component/simple-horizontal-cell/simple-horizontal-cell';
import { ThemedSwitch } from '../../../@generic/component/themed-switch/themed-switch';

interface Props {
    readonly syncEnabled: boolean;
    readonly onToggle: (enabled: boolean) => void;
}

export const SyncToggleCard = ({ syncEnabled, onToggle }: Props) => {
    const { t } = useLingui();

    return (
        <SimpleHorizontalCell
            right={<ThemedSwitch className='my-auto' value={syncEnabled} onValueChange={onToggle} />}
            title={t`Enable Auto-Sync`}
            description={t`Automatically sync your accounts and transactions`}
            size="lg"
        />
    );
};
