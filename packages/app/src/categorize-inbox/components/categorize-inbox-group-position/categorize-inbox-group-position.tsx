import { Trans } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

interface Props {
    readonly position: number | null;
    readonly total: number;
}

export const CategorizeInboxGroupPosition = ({ position, total }: Props) => {
    if (!isDefined(position)) {
        return null;
    }

    return (
        <Text className="text-secondary-foreground flex-1 text-center text-sm tabular-nums" numberOfLines={1}>
            <Trans>
                {position} of {total}
            </Trans>
        </Text>
    );
};
