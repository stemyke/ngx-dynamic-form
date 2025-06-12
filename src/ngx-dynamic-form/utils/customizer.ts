import {
    cachedFactory,
    CachedProvider,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    MaybeArray,
    MaybePromise
} from "@stemy/ngx-utils";

import {FormBuilderOptions, FormFieldConfig, FormFieldCustomizer} from "../common-types";

export interface IFormFieldCustomizer {
    acceptField(field: FormFieldConfig): boolean;
    customizeField(
        field: FormFieldConfig,
        property: IOpenApiSchemaProperty,
        schema: IOpenApiSchema,
        options: FormBuilderOptions
    ): MaybePromise<MaybeArray<FormFieldConfig>>;
}

export function customizeFormField(...providers: CachedProvider<IFormFieldCustomizer>[]): FormFieldCustomizer {
    const factory = cachedFactory(providers);
    return async (property, schema, config, options, injector) => {
        const customizers = factory(injector);
        const configs = [config];
        for (const customizer of customizers) {
            const index = configs.findIndex(m => customizer.acceptField(m));
            if (index >= 0) {
                const custom = await customizer.customizeField(
                    configs[index], property, schema, options
                );
                const result = Array.isArray(custom) ? custom : [custom];
                configs.splice(index, 1, ...result);
            }
        }
        return configs;
    }
}
