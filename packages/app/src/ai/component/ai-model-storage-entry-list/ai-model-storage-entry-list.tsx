import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { AiModelStorageActionStatusEnum } from '../../enum/ai-model-storage-action-status.enum';
import { AiModelStorageRow } from '../ai-model-storage-row/ai-model-storage-row';

import type { AiModelStorageIdEnum } from '../../enum/ai-model-storage-id.enum';
import type { AiModelStorageEntryInterface } from '../../interface/ai-model-storage-entry.interface';

interface Props {
    readonly entries: readonly AiModelStorageEntryInterface[];
    readonly removingId: AiModelStorageIdEnum | null;
    readonly isRemovingAll: boolean;
    readonly onRemove: (id: AiModelStorageIdEnum) => void;
}

export const AiModelStorageEntryList = ({ entries, removingId, isRemovingAll, onRemove }: Props) => {
    const isMutationRunning = isRemovingAll || isDefined(removingId);

    const getActionStatus = (entry: AiModelStorageEntryInterface): AiModelStorageActionStatusEnum => {
        if (isRemovingAll || removingId === entry.id) {
            return AiModelStorageActionStatusEnum.REMOVING;
        }
        if (isMutationRunning) {
            return AiModelStorageActionStatusEnum.DISABLED;
        }

        return AiModelStorageActionStatusEnum.IDLE;
    };

    return (
        <View className="gap-y-lg">
            {entries.map(entry => (
                <AiModelStorageRow key={entry.id} entry={entry} actionStatus={getActionStatus(entry)} onRemove={onRemove} />
            ))}
        </View>
    );
};
