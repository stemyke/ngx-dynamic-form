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
    acceptField(field: FormFieldConfig, parent: FormFieldConfig): boolean;
    customizeField(
        field: FormFieldConfig,
        property: IOpenApiSchemaProperty,
        schema: IOpenApiSchema,
        parent: FormFieldConfig,
        options: FormBuilderOptions
    ): MaybePromise<MaybeArray<FormFieldConfig>>;
}

export function customizeFormField(...providers: CachedProvider<IFormFieldCustomizer>[]): FormFieldCustomizer {
    const factory = cachedFactory(providers);
    return async (property, schema, config, parent, options, injector) => {
        const customizers = factory(injector);
        const configs = [config];
        for (const customizer of customizers) {
            const index = configs.findIndex(m => customizer.acceptField(m, parent));
            if (index >= 0) {
                const custom = await customizer.customizeField(
                    configs[index], property, schema, parent, options
                );
                const result = Array.isArray(custom) ? custom : [custom];
                configs.splice(index, 1, ...result);
            }
        }
        return configs;
    }
}
