import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListActionRow } from '../../../@generic/component/grouped-list-action-row/grouped-list-action-row';
import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useSingleFlight } from '../../../@generic/hook/use-single-flight.hook';
import { toastOnFailure } from '../../../@generic/utils/toast-on-failure.util';
import { SettingsPillButton } from '../../../settings/components/settings-pill-button/settings-pill-button';
import { aiModelStorageAtom } from '../../constant/ai-model-storage-atom.constant';
import { AiModelStorageService } from '../../service/ai-model-storage.service';

export const AiModelStorage = () => {
    const { t } = useLingui();
    const usage = useLiveAtomValue(aiModelStorageAtom);
    const refresh = useAtomRefresh(aiModelStorageAtom);
    const { isLoading: isDeleting, run: runDelete } = useSingleFlight();
    const formatSize = (bytes: number): string => {
        const unit = Math.min(3, Math.floor(Math.log10(Math.max(1, bytes)) / 3));

        return `${(bytes / 1000 ** unit).toFixed(unit === 0 ? 0 : 1)} ${[t`bytes`, 'KB', 'MB', 'GB'][unit]}`;
    };
    const handleDelete = () =>
        void runDelete(
            Effect.flatMap(AiModelStorageService, service => service.deleteUnused()).pipe(
                Effect.ensuring(Effect.sync(refresh)),
                toastOnFailure(t`Could not remove unused downloads`)
            )
        );
    const isLoading = AsyncResult.isInitial(usage);
    const isFailure = AsyncResult.isFailure(usage);
    const totalBytes = AsyncResult.isSuccess(usage) ? usage.value.totalBytes : 0;
    const unusedBytes = AsyncResult.isSuccess(usage) ? usage.value.unusedBytes : 0;
    const failureSubtitle = isFailure ? t`Could not load` : void 0;
    const accessory = isFailure ? (
        <SettingsPillButton label={t`Retry`} variant="secondary" onPress={refresh} />
    ) : (
        <LoadingContent isLoading={isLoading}>
            <Text className="text-[17px] text-secondary-foreground">{formatSize(totalBytes)}</Text>
        </LoadingContent>
    );

    return (
        <GroupedListSection title={t`Storage`}>
            <GroupedListRow title={t`Downloaded models`} subtitle={failureSubtitle} right={accessory} />
            {isPositiveNumber(unusedBytes) ? (
                <GroupedListActionRow
                    label={t`Remove unused downloads`}
                    icon={UserIconNameEnum.Trash2}
                    onPress={handleDelete}
                    isDisabled={false}
                    isLoading={isDeleting}
                    labelClassName="text-destructive-foreground"
                    trailing={<Text className="text-[17px] text-secondary-foreground">{formatSize(unusedBytes)}</Text>}
                />
            ) : null}
        </GroupedListSection>
    );
};
