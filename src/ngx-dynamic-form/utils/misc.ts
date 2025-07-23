import {AbstractControl} from "@angular/forms";
import {firstValueFrom, merge, Observable, of} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {ObjectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormStatus,
    FormFieldConfig,
    FormFieldKey,
    FormFieldProps,
    FormHookConfig,
    FormHookFn,
    FormSelectOption
} from "../common-types";
import {convertToDateFormat} from "./internal";

export function replaceSpecialChars(str: string, to: string = "-"): string {
    return `${str}`.replace(/[&\/\\#, +()$~%.@'":*?<>{}]/g, to);
}

/**
 * Creates a new observable that always starts with the controls current value.
 * @param control AbstractControl to retrieve value changes from
 * @param timeout Additional timeout
 */
export function controlValues(control: AbstractControl, timeout: number = 500): Observable<any> {
    const initial$ = of(control.value); // Emit immediately
    const changes$ = control.valueChanges.pipe(
        debounceTime(timeout)
    );
    return merge(initial$, changes$);
}

/**
 * Creates a new observable that always starts with the controls current status.
 * @param control AbstractControl to retrieve status changes from
 * @param timeout Additional timeout
 */
export function controlStatus(control: AbstractControl, timeout: number = 10): Observable<DynamicFormStatus> {
    const initial$ = of(control.status); // Emit immediately
    const changes$ = control.statusChanges.pipe(
        debounceTime(timeout)
    );
    return merge(initial$, changes$);
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

export async function getSelectOptions(field: FormFieldConfig): Promise<FormSelectOption[]> {
    const options = field.props?.options || [];
    if (options instanceof Observable) {
        return firstValueFrom(options);
    }
    return options;
}

export function replaceFieldArray(field: FormFieldConfig, items: any[]): void {
    const model = field.model || [];
    model.splice(0, model.length, ...items);
    field.options.build(field);
}

export function clearFieldArray(field: FormFieldConfig): void {
    const model = field.model || [];
    model.splice(0, model.length);
    field.options.build(field);
}

export function insertToFieldArray(field: FormFieldConfig, item: any, ix?: number): void {
    const model = field.model || [];
    ix = ix == null ? model.length : ix;
    model.splice(ix, 0, item);
    field.options.build(field);
}

export function removeFromFieldArray(field: FormFieldConfig, ix: number): void {
    const model = field.model || [];
    model.splice(ix, 1);
    field.options.build(field);
}

export function setFieldDefault(field: FormFieldConfig, value: any): void {
    field.defaultValue = value instanceof Date ? convertToDateFormat(value, field.props?.type || "date") : value;
}

interface SetFormFieldProps extends Omit<FormFieldProps, "min" | "max"> {
    min?: number | Date;
    max?: number | Date;
}

export function setFieldProps(field: FormFieldConfig, values: SetFormFieldProps): FormFieldConfig {
    if (!ObjectUtils.isObject(values)) return;
    const props = Object.assign({} as SetFormFieldProps, field.props || {});
    props.type = values.type || props.type;
    Object.keys(values).forEach(key => {
        const value = values[key];
        props[key] = value instanceof Date ? convertToDateFormat(value, props.type || "date") : value;
    });
    field.props = props;
    return field;
}

export function setFieldProp<P extends keyof SetFormFieldProps, V extends SetFormFieldProps[P]>(field: FormFieldConfig, prop: P, value: V): FormFieldConfig {
    return setFieldProps(field, {[prop]: value});
}

export function setFieldHidden(field: FormFieldConfig, hidden: boolean = true): void {
    setFieldProp(field, "hidden", hidden);
}

export function setFieldDisabled(field: FormFieldConfig, disabled: boolean = true): void {
    setFieldProp(field, "disabled", disabled);
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

export const MIN_INPUT_NUM = -1999999999;

export const MAX_INPUT_NUM = 1999999999;

export const EDITOR_FORMATS = ["php", "json", "html", "css", "scss"];
