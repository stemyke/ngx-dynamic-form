import {
    cachedFactory,
    CachedProvider,
    OpenApiSchema,
    OpenApiSchemaProperty,
    MaybeArray,
    MaybePromise
} from "@stemy/ngx-utils";

import {FormBuilderOptions, FormFieldConfig, FormFieldCustomizer} from "../common-types";

export interface IFormFieldCustomizer {
    acceptField(
        field: FormFieldConfig,
        property: OpenApiSchemaProperty,
        schema: OpenApiSchema
    ): boolean;
    customizeField(
        field: FormFieldConfig,
        options: FormBuilderOptions,
        property: OpenApiSchemaProperty,
        schema: OpenApiSchema
    ): MaybePromise<MaybeArray<FormFieldConfig>>;
}

export function customizeFormField(...providers: CachedProvider<IFormFieldCustomizer>[]): FormFieldCustomizer {
    const factory = cachedFactory(providers);
    return async (field, options, injector, property, schema) => {
        const customizers = factory(injector);
        const fields = [field];
        for (const customizer of customizers) {
            const index = fields.findIndex(m => customizer.acceptField(m, property, schema));
            if (index >= 0) {
                const custom = await customizer.customizeField(
                    fields[index], options, property, schema
                );
                const result = Array.isArray(custom) ? custom : [custom];
                fields.splice(index, 1, ...result);
            }
        }
        return fields;
    }
}
