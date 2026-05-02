export interface GenerateJsonSchemaInterface {
    readonly schema: object;
    readonly strict?: boolean;
}

export interface GenerateResponseFormatInterface {
    readonly jsonSchema: GenerateJsonSchemaInterface;
    readonly type: 'json_schema';
}
