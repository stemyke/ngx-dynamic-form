import {FormlyFieldConfig} from "@ngx-formly/core";
import {cachedFactory, CachedProvider, IOpenApiSchema, IOpenApiSchemaProperty} from "@stemy/ngx-utils";

import {FormFieldCustomizer, PromiseOrNot} from "../common-types";

export interface IFormFieldCustomizer {
    acceptField(config: FormlyFieldConfig, path: string): boolean;
    customizeField(
        config: FormlyFieldConfig,
        property: IOpenApiSchemaProperty,
        schema: IOpenApiSchema,
        path: string,
    ): PromiseOrNot<FormlyFieldConfig | FormlyFieldConfig[]>;
}

export function customizeFormField(...providers: CachedProvider<IFormFieldCustomizer>[]): FormFieldCustomizer {
    const factory = cachedFactory(providers);
    return async (property, schema, config, path, injector) => {
        const customizers = factory(injector);
        const configs = [config];
        for (const customizer of customizers) {
            const index = configs.findIndex(m => customizer.acceptField(m, path));
            if (index >= 0) {
                const custom = await customizer.customizeField(
                    configs[index], property, schema, path
                );
                const result = Array.isArray(custom) ? custom : [custom];
                configs.splice(index, 1, ...result);
            }
        }
        return configs;
    }
}
