import {Injector, OutputRef, Signal} from "@angular/core";
import {AbstractControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {FormlySelectOption} from "@ngx-formly/core/select";
import {IAsyncMessage, IOpenApiSchema, IOpenApiSchemaProperty} from "@stemy/ngx-utils";

// --- Basic form control interfaces ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

export interface FormBaseFieldConfig extends FormlyFieldConfig {

}

export type FormFieldSerializer = (field: FormBaseFieldConfig) => Promise<any>;

export interface FormFieldConfig extends FormBaseFieldConfig {
    serializer?: FormFieldSerializer;
}

export interface FormSerializeResult {
    [key: string]: any;
}

export interface IDynamicForm {

    readonly fields: Signal<FormFieldConfig[]>;
    readonly group: Signal<FormGroup>;
    readonly status: Signal<DynamicFormState>;
    readonly onSubmit: OutputRef<IDynamicForm>;

}

export type PromiseOrNot<T> = Promise<T> | T;

export interface FormSelectOption extends FormlySelectOption {
    classes?: string[];
}

export type FormSelectOptions = FormSelectOption[] | Observable<FormSelectOption[]>;

export type FormFieldCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    field: FormlyFieldConfig, path: string, injector: Injector
) => PromiseOrNot<FormlyFieldConfig | FormlyFieldConfig[]>;

export interface ConfigForSchemaOptions {
    labelPrefix?: string;
    customizer?: FormFieldCustomizer;
}

export interface ConfigForSchemaWrapOptions extends Omit<ConfigForSchemaOptions, "customizer"> {
    schema: IOpenApiSchema;
    injector?: Injector;
    customizer?: (
        property: IOpenApiSchemaProperty, options: ConfigForSchemaWrapOptions,
        field: FormlyFieldConfig, path: string
    ) => Promise<FormlyFieldConfig[]>;
}

type FormlyValidatorFn<T> = (control: AbstractControl, field?: FormlyFieldConfig) => T;

export type ValidationMessageFn = (error: any, field: FormlyFieldConfig) => string | Observable<string>;

interface FormlyValidatorExpression<T> {
    expression: FormlyValidatorFn<T>;
    message: ValidationMessageFn;
}

type FormlyValidation<T, R> = {
    validation?: (string | T)[];
} & {
    [key: string]: FormlyValidatorFn<R> | FormlyValidatorExpression<R>;
}

export type ValidatorFn = FormlyValidatorFn<boolean>;

export type ValidatorExpression = FormlyValidatorExpression<boolean>;

export type Validators = FormlyValidation<ValidatorFn, boolean>;

export type AsyncBoolean = Promise<boolean> | Observable<boolean>;

export type AsyncValidatorFn = FormlyValidatorFn<AsyncBoolean>;

export type AsyncValidatorExpression = FormlyValidatorExpression<AsyncBoolean>;

export type AsyncValidators = FormlyValidation<AsyncValidatorFn, AsyncBoolean>;

export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export interface IDynamicFormModuleConfig {
    // controlProvider?: (injector: Injector) => DynamicFormControlMapFn;
}
