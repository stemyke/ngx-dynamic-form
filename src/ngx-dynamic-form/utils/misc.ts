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

export const MIN_INPUT_NUM = -999999999;

export const MAX_INPUT_NUM = 999999999;

export const EDITOR_FORMATS = ["php", "json", "html", "css", "scss"];
