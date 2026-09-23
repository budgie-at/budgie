import { WidgetDeltaDirectionEnum } from '../enum/widget-delta-direction.enum';
import type { WidgetPaletteInterface } from '../interface/widget-palette.interface';

import BudgetWidget from './budget.widget';
import NetWorthWidget from './net-worth.widget';
import QuickAddWidget from './quick-add.widget';

const palette: WidgetPaletteInterface = {
    light: {
        background: '#FFFFFF',
        primary: '#111111',
        secondary: '#7A7A7A',
        positive: '#1FA971',
        destructive: '#D92D20',
        warning: '#F79009'
    },
    dark: {
        background: '#000000',
        primary: '#FFFFFF',
        secondary: '#9A9A9A',
        positive: '#3DDC97',
        destructive: '#FF5A5F',
        warning: '#FDB022'
    }
};

const seedWidgets = (): void => {
    NetWorthWidget.updateSnapshot({
        netWorth: {
            formattedTotal: '$17,525.07',
            formattedDelta: '+$412.90',
            deltaDirection: WidgetDeltaDirectionEnum.UP,
            accountTypes: [
                { label: 'Cash', formattedTotal: '$3,120.00' },
                { label: 'Bank', formattedTotal: '$12,905.07' },
                { label: 'Crypto', formattedTotal: '$1,500.00' }
            ]
        },
        runway: { isPositive: true, label: '+$309/mo' },
        palette,
        deltaColorLight: palette.light.positive,
        deltaColorDark: palette.dark.positive,
        netWorthTitle: 'Net worth',
        thisMonth: 'this month',
        empty: 'No data yet',
        homeUrl: 'budgie://'
    });

    BudgetWidget.updateSnapshot({
        budget: {
            formattedSpent: '$3,807.35',
            formattedLimit: '$4,030.00',
            formattedRemaining: '$222.65',
            progressRatio: 0.9448,
            isOverLimit: false,
            formattedDaysLeft: '7 days left',
            formattedSafePerDay: '$31.80',
            periodLabel: 'September',
            categories: [
                { title: 'Groceries', progressRatio: 0.82, isOverLimit: false },
                { title: 'Transport', progressRatio: 1.14, isOverLimit: true },
                { title: 'Eating out', progressRatio: 0.47, isOverLimit: false }
            ]
        },
        palette,
        budgetTitle: 'Budget',
        perDay: 'per day',
        left: 'left',
        over: 'over',
        noBudget: 'No budget set',
        budgetUrl: 'budgie://budget'
    });

    QuickAddWidget.updateSnapshot({
        palette,
        expense: 'Expense',
        income: 'Income',
        transfer: 'Transfer',
        expenseUrl: 'budgie://create-transaction/expense',
        incomeUrl: 'budgie://create-transaction/income',
        transferUrl: 'budgie://create-transaction/transfer',
        homeUrl: 'budgie://',
        glyphPath: ''
    });
};

seedWidgets();
