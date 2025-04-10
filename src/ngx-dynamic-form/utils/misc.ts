import {DynamicFormModel, DynamicPathable} from "@ng-dynamic-forms/core";
import {IOpenApiSchemaProperty} from "@stemy/ngx-utils";
import {FormlyFieldConfig} from "@ngx-formly/core";

export function isStringWithVal(val: any): boolean {
    return typeof val == "string" && val.length > 0;
}

export function findRefs(property: IOpenApiSchemaProperty): string[] {
    const refs = Array.isArray(property.allOf)
        ? property.allOf.map(o => o.$ref).filter(isStringWithVal)
        : [property.items?.$ref, property.$ref].filter(isStringWithVal);
    return refs.map(t => t.split("/").pop());
}

export function replaceSpecialChars(str: string, to: string = "-"): string {
    return `${str}`.replace(/[&\/\\#, +()$~%.@'":*?<>{}]/g, to);
}

export function mergeFormModels(formModels: DynamicFormModel[]): DynamicFormModel {
    const res: DynamicFormModel = [];
    for (const formModel of formModels) {
        for (const subModel of formModel) {
            const index = res.findIndex(t => t.id == subModel.id);
            if (index >= 0) {
                res[index] = subModel;
                continue;
            }
            res.push(subModel);
        }
    }
    return res;
}

export function mergeFormFields(formFields: FormlyFieldConfig[][]): FormlyFieldConfig[] {
    const res: FormlyFieldConfig[] = [];
    for (const formModel of formFields) {
        for (const subModel of formModel) {
            const index = res.findIndex(t => t.key == subModel.key);
            if (index >= 0) {
                res[index] = subModel;
                continue;
            }
            res.push(subModel);
        }
    }
    return res;
}

export function collectPathAble<T extends DynamicPathable>(start: T, getter: (cur: T & DynamicPathable) => string): string[] {
    if (!start || !getter(start)) return [];
    const parts = [];
    let currentPath = start;
    while (currentPath) {
        const val = getter(currentPath);
        if (val) {
            parts.unshift(val);
        }
        currentPath = currentPath.parent as T;
    }
    return parts;
}

export function getDynamicPath(start: DynamicPathable): string {
    return collectPathAble(start, t => t.id).join(".");
}

export const MIN_INPUT_NUM = -999999999;

export const MAX_INPUT_NUM = 999999999;

export const EDITOR_FORMATS = ["php", "json", "html", "css", "scss"];
