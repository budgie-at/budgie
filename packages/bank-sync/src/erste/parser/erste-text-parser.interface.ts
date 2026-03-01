import type { ErsteParsedDataInterface } from '../interface/erste-parsed-data.interface';

export interface ErsteTextParserInterface {
    parse(text: string): ErsteParsedDataInterface;
}
