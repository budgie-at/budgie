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

    useEffect(() => {
        let isActive = true;

        const runCheck = async (): Promise<void> => {
            const missing = await budgetRepository.countMissingInstrument();
            if (!isActive) {
                return;
            }
            setStatus(missing > 0 ? BudgetIntegrityStatusEnum.INCOMPLETE : BudgetIntegrityStatusEnum.OK);
        };

        const handleError = (error: unknown) => {
            logger.error('check-failed', { errorMessage: getErrorMessage(error) });
            if (isActive) {
                setStatus(BudgetIntegrityStatusEnum.OK);
            }
        };

        logger.log('mounted');
        void runCheck().catch(handleError);

        return () => {
            isActive = false;
        };
    }, []);

    const handleForeground = (isActive: boolean) => {
        if (!isActive) {
            return;
        }

        const runCheck = async (): Promise<void> => {
            const missing = await budgetRepository.countMissingInstrument();
            setStatus(missing > 0 ? BudgetIntegrityStatusEnum.INCOMPLETE : BudgetIntegrityStatusEnum.OK);
        };

        const handleError = (error: unknown) => {
            logger.error('check-failed', { errorMessage: getErrorMessage(error) });
        };

        void runCheck().catch(handleError);
    };

    useAppState(handleForeground);

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
