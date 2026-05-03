import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isEmptyArray } from '@rnw-community/shared';

import { VoiceReviewRowInterface } from '../../interface/voice-review-row.interface';
import { VoiceReviewRow } from '../voice-review-row/voice-review-row';

interface Props {
    readonly rows: VoiceReviewRowInterface[];
    readonly onEdit: (id: string, patch: Partial<Pick<VoiceReviewRowInterface, 'amountMicroUnits' | 'description'>>) => void;
    readonly onDelete: (id: string) => void;
}

export const VoiceReviewList = ({ rows, onEdit, onDelete }: Props) => {
    const { t } = useLingui();

    if (isEmptyArray(rows)) {
        return (
            <View className="flex-1 items-center justify-center px-lg">
                <Text className="text-md text-secondary-foreground">{t`No items to save`}</Text>
                <Text className="mt-xs text-sm text-secondary-foreground opacity-60">{t`Tap re-record to try again`}</Text>
            </View>
        );
    }

    return (
        <View className="gap-y-md px-lg">
            {rows.map((row, index) => (
                <VoiceReviewRow key={row.id} row={row} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}
        </View>
    );
};
