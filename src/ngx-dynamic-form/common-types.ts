import {Injector, OutputRef, Signal} from "@angular/core";
import {AbstractControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {FormlyFieldConfig, FormlyFieldProps} from "@ngx-formly/core";
import {FormlySelectOption} from "@ngx-formly/core/select";
import {IAsyncMessage, IOpenApiSchema, IOpenApiSchemaProperty} from "@stemy/ngx-utils";

export type PromiseOrNot<T> = Promise<T> | T;

// --- Basic form types ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

// --- Basic form field interfaces ---

export interface FormBuilderOptions {
    labelPrefix?: string;
}

export interface FormFieldProps extends FormlyFieldProps {
    multiple?: boolean;
}

export interface FormBaseFieldConfig<T = FormFieldProps> extends FormlyFieldConfig<T> {

}

export type FormFieldSerializer = (field: FormBaseFieldConfig, injector: Injector) => PromiseOrNot<any>;

export interface FormFieldConfig<T = FormFieldProps> extends FormBaseFieldConfig<T> {
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

export interface FormSelectOption extends FormlySelectOption {
    className?: string;
    classes?: string[] | string;
    id?: any;
}

export type FormSelectOptions = FormSelectOption[] | Observable<FormSelectOption[]>;

// --- Validation types ---

type FormFieldValidatorFn<T> = (control: AbstractControl, field?: FormlyFieldConfig) => T;

export type ValidationMessageFn = (error: any, field: FormFieldConfig) => string | Observable<string>;

interface FormFieldValidatorExpression<T> {
    expression: FormFieldValidatorFn<T>;
    message: ValidationMessageFn;
}

type FormFieldValidation<T, R> = {
    validation?: (string | T)[];
} & {
    [key: string]: FormFieldValidatorFn<R> | FormFieldValidatorExpression<R>;
}

export type ValidatorFn = FormFieldValidatorFn<boolean>;

export type ValidatorExpression = FormFieldValidatorExpression<boolean>;

export type Validators = FormFieldValidation<ValidatorFn, boolean>;

export type AsyncBoolean = Promise<boolean> | Observable<boolean>;

export type AsyncValidatorFn = FormFieldValidatorFn<AsyncBoolean>;

export type AsyncValidatorExpression = FormFieldValidatorExpression<AsyncBoolean>;

export type AsyncValidators = FormFieldValidation<AsyncValidatorFn, AsyncBoolean>;

// --- Form field data types ---

export type FormFieldData = Pick<FormFieldProps, "label" | "readonly" | "hidden">
    & {
    validators?: Validators | ValidatorFn[],
    serializer?: FormFieldSerializer,
    fieldSet?: string,
    classes?: string
};

export type FormInputData = FormFieldData
    & Pick<FormFieldProps, "type" | "placeholder" | "step" | "min" | "max" | "minLength" | "maxLength">
    & { autocomplete?: string, accept?: string };

export type FormSelectData = FormFieldData
    & Pick<FormFieldProps, "type" | "placeholder" | "step" | "min" | "max" | "minLength" | "maxLength">
    & { autocomplete?: string };

export type FormUploadData = FormFieldData
    & Pick<FormFieldProps, "type" | "placeholder" | "step" | "min" | "max" | "minLength" | "maxLength">
    & { autocomplete?: string };

export type FormGroupData = FormFieldData
    & Pick<FormFieldProps, "type" | "placeholder" | "step" | "min" | "max" | "minLength" | "maxLength">
    & { autocomplete?: string };

// --- JSON schema interfaces ---

export type FormFieldCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    field: FormlyFieldConfig, path: string, injector: Injector
) => PromiseOrNot<FormlyFieldConfig | FormlyFieldConfig[]>;

export interface ConfigForSchemaOptions extends FormBuilderOptions {
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


export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export interface IDynamicFormModuleConfig {
    // controlProvider?: (injector: Injector) => DynamicFormControlMapFn;
}
