import { useLingui } from '@lingui/react/macro';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Motion } from '../motion/motion';

import { DebtSectionCard } from './debt-section-card';
import { DebtSectionLoanCard } from './debt-section-loan-card';

const viewportOnce = { once: true };
const leftColumnInitial = { opacity: 0, x: -20 };
const leftColumnAnimate = { opacity: 1, x: 0 };
const leftColumnTransition = { duration: 0.5, delay: 0.2 };

export const DebtSectionVisual = () => {
    const { t } = useLingui();

    return (
        <Motion
            className="order-2 lg:order-1"
            initial={leftColumnInitial}
            transition={leftColumnTransition}
            viewport={viewportOnce}
            whileInView={leftColumnAnimate}
        >
            <div className="space-y-4">
                <DebtSectionCard
                    amount="$350"
                    amountClassName="text-green-600"
                    dueDate={t`Due Feb 15, 2025`}
                    icon={<ArrowUpRight className="size-6 text-green-600" />}
                    iconClassName="bg-green-100 dark:bg-green-900/30"
                    label={t`Mike owes you`}
                />

                <DebtSectionCard
                    amount="$120"
                    amountClassName="text-orange-600"
                    dueDate={t`Due Jan 30, 2025`}
                    icon={<ArrowDownRight className="size-6 text-orange-600" />}
                    iconClassName="bg-orange-100 dark:bg-orange-900/30"
                    label={t`You owe Sarah`}
                />

                <DebtSectionLoanCard />
            </div>
        </Motion>
    );
};
