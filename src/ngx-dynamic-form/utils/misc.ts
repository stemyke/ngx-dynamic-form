import {BehaviorSubject, Subject} from "rxjs";
import {ObjectUtils} from "@stemy/ngx-utils";
import {FormFieldKey, FormFieldConfig} from "../common-types";

export function replaceSpecialChars(str: string, to: string = "-"): string {
    return `${str}`.replace(/[&\/\\#, +()$~%.@'":*?<>{}]/g, to);
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

export function getFieldsByPredicate(field: FormFieldConfig, cb: (field: FormFieldConfig) => boolean): FormFieldConfig[] {
    if (cb(field)) {
        return [field];
    }
    if (!field.fieldGroup) return [];
    const results: FormFieldConfig[] = [];
    for (const sf of field.fieldGroup) {
        results.push(...getFieldsByPredicate(sf, cb));
    }
    return results;
}

export function getFieldsByKey(field: FormFieldConfig, key: FormFieldKey): FormFieldConfig[] {
    return getFieldsByPredicate(field, f => f.key === key);
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

export function additionalFieldValues(field: FormFieldConfig, values: {[key: string]: any}): void {
    const additional = field.expressions?.additional;
    if (additional instanceof BehaviorSubject) {
        additional.next(ObjectUtils.assign(additional.value, values || {}));
        return;
    }
    field.expressions.additional = new BehaviorSubject(values || {});
}

export const MIN_INPUT_NUM = -999999999;

export const MAX_INPUT_NUM = 999999999;

export const EDITOR_FORMATS = ["php", "json", "html", "css", "scss"];
