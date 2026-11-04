import type { InzhurFundLayoutInterface } from './inzhur-fund-layout.interface';

export const INZHUR_ENERGY_LAYOUT: InzhurFundLayoutInterface = {
    isin: 'UA5000012246',
    nominalValue: 4000,
    nameLines: ['ТОВАРИСТВО З ОБМЕЖЕНОЮ', 'ВІДПОВІДАЛЬНІСТЮ "ІНЖУР"', '(ПАЙОВИЙ ІНВЕСТИЦІЙНИЙ', 'ФОНД "ІНЖУР ЕНЕРДЖІ");', 'Дійсний'],
    codeLines: ['44154853 -', '23201633']
};

export const INZHUR_REIT_LAYOUT: InzhurFundLayoutInterface = {
    isin: 'UA5000014044',
    nominalValue: 10,
    nameLines: [
        'ТОВАРИСТВО З ОБМЕЖЕНОЮ',
        'ВІДПОВІДАЛЬНІСТЮ',
        '"ІНЖУР"/ЗАКРИТИЙ',
        'НЕДИВЕРСИФІКОВАНИЙ',
        'ПАЙОВИЙ ІНВЕСТИЦІЙНИЙ',
        'ФОНД "ІНЖУР REIT"; Дійсний'
    ],
    codeLines: ['44154853 -', '23201750']
};

export const INZHUR_UNKNOWN_LAYOUT: InzhurFundLayoutInterface = {
    isin: 'UA5000099999',
    nominalValue: 100,
    nameLines: ['ТОВАРИСТВО З ОБМЕЖЕНОЮ', 'ВІДПОВІДАЛЬНІСТЮ "ІНЖУР"', '(ПАЙОВИЙ ІНВЕСТИЦІЙНИЙ', 'ФОНД "ІНЖУР ТЕСТ");', 'Дійсний'],
    codeLines: ['44154853 -', '23209999']
};

export const INZHUR_MILTECH_LAYOUT: InzhurFundLayoutInterface = {
    isin: 'UA5000066666',
    nominalValue: 1000,
    nameLines: ['ТОВАРИСТВО З ОБМЕЖЕНОЮ', 'ВІДПОВІДАЛЬНІСТЮ "ІНЖУР"', '(ПАЙОВИЙ ІНВЕСТИЦІЙНИЙ', 'ФОНД "ІНЖУР МІЛТЕХ");', 'Дійсний'],
    codeLines: ['44154853 -', '23206666']
};

export const INZHUR_UNQUOTED_LAYOUT: InzhurFundLayoutInterface = {
    isin: 'UA5000088888',
    nominalValue: 100,
    nameLines: ['ТОВАРИСТВО З ОБМЕЖЕНОЮ', 'ВІДПОВІДАЛЬНІСТЮ; Дійсний'],
    codeLines: ['44154853 -', '23208888']
};

export const INZHUR_UNTERMINATED_LAYOUT: InzhurFundLayoutInterface = {
    isin: 'UA5000077777',
    nominalValue: 100,
    nameLines: ['ТОВАРИСТВО З ОБМЕЖЕНОЮ', 'ВІДПОВІДАЛЬНІСТЮ'],
    codeLines: ['44154853 -', '23207777']
};
