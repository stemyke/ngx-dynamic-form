import {Type} from "@angular/core";
import {DynamicFormControlModel, DynamicFormControlModelConfig} from "@ng-dynamic-forms/core";
import {cachedFactory, IOpenApiSchema, IOpenApiSchemaProperty} from "@stemy/ngx-utils";

import {FormModelCustomizer, PromiseOrNot} from "../common-types";

export interface IFormModelCustomizer {
    acceptModel(
        model: DynamicFormControlModel,
        config: DynamicFormControlModelConfig,
        property: IOpenApiSchemaProperty,
        schema: IOpenApiSchema
    ): PromiseOrNot<boolean>;
    customizeModel(
        model: DynamicFormControlModel,
        config: DynamicFormControlModelConfig,
        property: IOpenApiSchemaProperty,
        schema: IOpenApiSchema
    ): PromiseOrNot<DynamicFormControlModel>;
}

export function customizeModel(...types: Type<IFormModelCustomizer>[]): FormModelCustomizer {
    const factory = cachedFactory(types);
    return async (property, schema, model, config, injector) => {
        const customizers = factory(injector);
        for (const customizer of customizers) {
            const accept = await customizer.acceptModel(model, config, property, schema);
            if (accept) {
                return customizer.customizeModel(model, config, property, schema);
            }
        }
        return model;
    }
}
