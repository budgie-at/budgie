import { getLogger } from '@budgie/logger';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { ReactNode, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { getErrorMessage } from '@rnw-community/shared';

import { Button } from '../../../@generic/component/button/button';
import { budgetRepository } from '../../../@generic/drizzle/db/db';
import { useAppState } from '../../../@generic/hook/use-app-state.hook';
import { BudgetIntegrityStatusEnum } from '../../enum/budget-integrity-status.enum';

interface Props {
    readonly children: ReactNode;
}

const logger = getLogger('BudgetIntegrityGuard');

const handleOpenSettings = () => void router.push('/settings');

export const BudgetIntegrityGuard = ({ children }: Props) => {
    const [status, setStatus] = useState<BudgetIntegrityStatusEnum>(BudgetIntegrityStatusEnum.CHECKING);

    const runCheck = (): void => {
        budgetRepository
            .countMissingInstrument()
            .then(missing => void setStatus(missing > 0 ? BudgetIntegrityStatusEnum.INCOMPLETE : BudgetIntegrityStatusEnum.OK))
            .catch((error: unknown) => {
                logger.error('check-failed', { errorMessage: getErrorMessage(error) });
                setStatus(BudgetIntegrityStatusEnum.OK);
            });
    };

    useEffect(() => {
        logger.log('mounted');
        runCheck();
         
    }, []);

    useAppState(isActive => {
        if (isActive) {
            runCheck();
        }
    });

    if (status === BudgetIntegrityStatusEnum.INCOMPLETE) {
        return (
            <View className="bg-primary-reverse flex-1 items-center justify-center gap-y-xl px-3xl">
                <Text className="text-primary-foreground text-lg font-semibold text-center">
                    <Trans>Budget setup incomplete</Trans>
                </Text>
                <Text className="text-secondary-foreground text-md text-center">
                    <Trans>A default currency is required before you can manage budgets.</Trans>
                </Text>
                <Button variant="primary" content={t`Open settings`} onPress={handleOpenSettings} />
            </View>
        );
    }

    return children;
};
