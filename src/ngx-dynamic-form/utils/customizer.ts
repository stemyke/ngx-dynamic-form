import {Type} from "@angular/core";
import {
    DynamicFormControlComponent,
    DynamicFormControlModel,
    DynamicFormControlModelConfig
} from "@ng-dynamic-forms/core";
import {CachedProvider, cachedFactory, IOpenApiSchema, IOpenApiSchemaProperty} from "@stemy/ngx-utils";

import {FormModelCustomizer, GetFormControlComponentType, PromiseOrNot} from "../common-types";

export interface IFormComponentCustomizer {
    acceptModel(model: DynamicFormControlModel): boolean;
    getFormComponent(model: DynamicFormControlModel): Type<DynamicFormControlComponent>;
}

export function getFormComponent(...providers: CachedProvider<IFormComponentCustomizer>[]): GetFormControlComponentType {
    const factory = cachedFactory(providers);
    return (model, injector) => {
        const customizers = factory(injector);
        for (const customizer of customizers) {
            const component = customizer.acceptModel(model) ? customizer.getFormComponent(model) : null;
            if (component) {
                return component;
            }
        }
        return null;
    }
}

export interface IFormModelCustomizer {
    acceptModel(model: DynamicFormControlModel): boolean;
    customizeModel(
        model: DynamicFormControlModel,
        config: DynamicFormControlModelConfig,
        property: IOpenApiSchemaProperty,
        schema: IOpenApiSchema
    ): PromiseOrNot<DynamicFormControlModel | DynamicFormControlModel[]>;
}

export function customizeFormModel(...providers: CachedProvider<IFormModelCustomizer>[]): FormModelCustomizer {
    const factory = cachedFactory(providers);
    return async (property, schema, model, config, injector) => {
        const customizers = factory(injector);
        const models = [model];
        for (const customizer of customizers) {
            const index = models.findIndex(m => customizer.acceptModel(m));
            if (index >= 0) {
                const custom = await customizer.customizeModel(
                    models[index], config, property, schema
                );
                const result = Array.isArray(custom) ? custom : [custom];
                models.splice(index, 1, ...result);
            }
        }
        return models;
    }
}
