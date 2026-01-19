import { BudgetCreateInputInterface, BudgetCreateInputSchema, BudgetPeriodEnum } from '@budgie/contracts';
import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, createContext, use } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';

interface BudgetSetupContextInterface {
    form: UseFormReturn<BudgetCreateInputInterface>;
}

const BudgetSetupContext = createContext<BudgetSetupContextInterface | null>(null);

interface Props {
    readonly children: ReactNode;
}

export const BudgetSetupProvider = ({ children }: Props) => {
    const form = useForm<BudgetCreateInputInterface>({
        resolver: zodResolver(BudgetCreateInputSchema),
        mode: 'onSubmit',
        defaultValues: {
            period: BudgetPeriodEnum.MONTHLY,
            periodStartDay: 1,
            overallLimit: 0,
            startDate: new Date(),
            endDate: new Date(),
            categoryLimits: [],
            incomeExpectations: [],
            rolloverEnabled: false,
            rolloverDeficitEnabled: false
        }
    });

    const contextValue = { form };

    return <BudgetSetupContext value={contextValue}>{children}</BudgetSetupContext>;
};

export const useBudgetSetupContext = () => {
    const context = use(BudgetSetupContext);

    if (context === null) {
        // eslint-disable-next-line lingui/no-unlocalized-strings
        throw new Error('useBudgetSetupContext must be used within a BudgetSetupProvider');
    }

    return context;
};
