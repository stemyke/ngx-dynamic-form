import {ObjectUtils} from "@stemy/ngx-utils";
import {BehaviorSubject, Subject} from "rxjs";
import {FormFieldConfig} from "../common-types";

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

export function getFieldsByKey(field: FormFieldConfig, key: string): FormFieldConfig[] {
    if (field.key === key) {
        return [field];
    }
    if (!field.fieldGroup) return [];
    const results: FormFieldConfig[] = [];
    for (const sf of field.fieldGroup) {
        results.push(...getFieldsByKey(sf, key));
    }
    return results;
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
