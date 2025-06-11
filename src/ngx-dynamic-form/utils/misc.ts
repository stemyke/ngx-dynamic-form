import {IOpenApiSchemaProperty} from "@stemy/ngx-utils";
import {BehaviorSubject, Subject} from "rxjs";
import {FormFieldConfig} from "../common-types";

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

export function mergeFormFields(formFields: FormFieldConfig[][]): FormFieldConfig[] {
    const res: FormFieldConfig[] = [];
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

export function getFieldByPath(field: FormFieldConfig, path: string): FormFieldConfig | null {
    if (field.path === path) {
        return field;
    }
    if (!field.fieldGroup) return null;
    for (const sf of field.fieldGroup) {
        const found = getFieldByPath(sf, path);
        if (found) return found;
    }
    return null;
}

export function setFieldHidden(field: FormFieldConfig, hidden: boolean = true): void {
    const hide = field.expressions?.hide;
    if (hide) {
        if (hide instanceof Subject) {
            hide.next(hidden);
            return;
        }
        field.expressions.hide = new BehaviorSubject(hidden);
        return;
    }
    field.hide = hidden;
}

export function setFieldDisabled(field: FormFieldConfig, disabled: boolean = true): void {
    field.props = {
        ...(field.props || {}),
        disabled
    };
}

export const MIN_INPUT_NUM = -999999999;

export const MAX_INPUT_NUM = 999999999;

export const EDITOR_FORMATS = ["php", "json", "html", "css", "scss"];
