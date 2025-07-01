import {ObjectUtils} from "@stemy/ngx-utils";
import {FormFieldConfig, FormFieldKey, FormHookConfig, FormHookFn} from "../common-types";

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
    field.props = {
        ...(field.props || {}),
        hidden
    };
}

export function setFieldDisabled(field: FormFieldConfig, disabled: boolean = true): void {
    field.props = {
        ...(field.props || {}),
        disabled
    };
}

export function setFieldHooks(field: FormFieldConfig, hooks: FormHookConfig): void {
    field.hooks = field.hooks || {};
    Object.keys(hooks).forEach(name => {
        const original = field.hooks[name] as FormHookFn;
        const hook = hooks[name] as FormHookFn;
        if (!ObjectUtils.isFunction(hook)) return;
        field.hooks[name] = ObjectUtils.isFunction(original)
            ? ((field: FormFieldConfig) => {
                original(field);
                hook(field);
            })
            : hooks[name];
    });
}

export function additionalFieldValue(field: FormFieldConfig, path: string): any {
    return ObjectUtils.getValue(field.additional, path, null, false);
}

export function additionalFieldValues(field: FormFieldConfig, values: {[key: string]: any}): void {
    field.props = field.props || {};
    field.props.additional = ObjectUtils.assign(field.props.additional || {}, values || {});
}

export const MIN_INPUT_NUM = -999999999;

export const MAX_INPUT_NUM = 999999999;

export const EDITOR_FORMATS = ["php", "json", "html", "css", "scss"];
