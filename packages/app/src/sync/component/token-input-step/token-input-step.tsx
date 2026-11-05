import { ExternalSourceEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { isLikelyMonoToken } from '../../type-guard/is-likely-mono-token.type-guard';
import { PasteTokenButton } from '../paste-token-button/paste-token-button';
import { SyncCredentialRow } from '../sync-credential-row/sync-credential-row';
import { SyncCredentialsStepHeader } from '../sync-credentials-step-header/sync-credentials-step-header';

import { TokenInputStepSelector } from './token-input-step.selector';

interface Props {
    readonly token: string;
    readonly onTokenChange: (token: string) => void;
}

export const TokenInputStep = ({ token, onTokenChange }: Props) => {
    const { t } = useLingui();

    const hasToken = isNotEmptyString(token.trim());
    const isTokenLikely = isLikelyMonoToken(token);
    const tokenCheckIcon = isTokenLikely ? UserIconNameEnum.CircleCheck : UserIconNameEnum.CircleAlert;
    const tokenCheckClassName = isTokenLikely ? 'text-positive-foreground' : 'text-warning-foreground';
    const tokenCheckLabel = isTokenLikely ? t`Looks right` : t`This doesn't look like a Monobank token yet`;

    return (
        <>
            <SyncCredentialsStepHeader provider={ExternalSourceEnum.MONOBANK} />

            <View>
                <GroupedListSection>
                    <SyncCredentialRow
                        icon={UserIconNameEnum.KeyRound}
                        title={t`API token`}
                        value={token}
                        onChangeText={onTokenChange}
                        placeholder={t`Enter your Monobank API token`}
                        secureTextEntry
                        right={<PasteTokenButton onPaste={onTokenChange} />}
                        testID={TokenInputStepSelector.Input}
                    />
                </GroupedListSection>

                {hasToken ? (
                    <View className="flex-row items-center gap-x-xs px-3xl pt-md">
                        <Icon icon={tokenCheckIcon} size={14} className={tokenCheckClassName} />
                        <Text className={cn('text-[13px]', tokenCheckClassName)}>{tokenCheckLabel}</Text>
                    </View>
                ) : null}
            </View>
        </>
    );
};
