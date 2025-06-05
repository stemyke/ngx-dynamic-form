import {Injector, OutputRef, Signal} from "@angular/core";
import {AbstractControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {FieldTypeConfig, FormlyFieldConfig, FormlyFieldProps} from "@ngx-formly/core";
import {FormlySelectOption} from "@ngx-formly/core/select";
import {IAsyncMessage, IOpenApiSchema, IOpenApiSchemaProperty, IRequestOptions} from "@stemy/ngx-utils";

export type PromiseOrNot<T> = Promise<T> | T;

// --- Basic frm constants ---
export const FORM_ROOT_KEY = "__root";

// --- Basic form types ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";
export type UploadData = Record<string, any> | ArrayBuffer | FormData;

// --- Basic form field interfaces ---

export interface FormBuilderOptions {
    labelPrefix?: string;
}

export interface FormFieldProps extends FormlyFieldProps {
    // --- Input props ---
    autocomplete?: string;
    // --- Checkbox props ---
    formCheck?: string;
    indeterminate?: boolean;
    // --- Select props ---
    multiple?: boolean;
    inline?: boolean;
    allowEmpty?: boolean;
    groupBy?: string;
    // --- Array props ---
    useTabs?: boolean;
    tabsLabel?: string;
    addItem?: boolean;
    insertItem?: boolean;
    cloneItem?: boolean;
    moveItem?: boolean;
    removeItem?: boolean;
    clearItems?: boolean;
    // --- Upload props ---
    accept?: string | string[];
    url?: string;
    maxSize?: number;
    uploadOptions?: IRequestOptions;
    createUploadData?: (file: File) => UploadData | Promise<UploadData>;
    // --- Old upload props
    multi?: boolean;
    asFile?: boolean;
    uploadUrl?: string;
}

export interface FormBaseFieldConfig<T = FormFieldProps> extends FormlyFieldConfig<T> {

}

export type FormFieldSerializer = (field: FormBaseFieldConfig, injector: Injector) => PromiseOrNot<any>;

export declare type FormHookFn = (field: FormBaseFieldConfig) => void;

export interface FormHookConfig {
    onInit?: FormHookFn | ((field: FormBaseFieldConfig) => Observable<any>);
    onChanges?: FormHookFn;
    afterContentInit?: FormHookFn;
    afterViewInit?: FormHookFn;
    onDestroy?: FormHookFn;
}

export interface FormFieldConfig<T = FormFieldProps> extends FormBaseFieldConfig<T> {
    serializer?: FormFieldSerializer;
    serialize?: boolean;
    fieldSet?: string;
    hooks?: FormHookConfig;
}

export interface FormFieldType<T = FormFieldProps> extends FieldTypeConfig<T> {

}

export interface FormSerializeResult {
    [key: string]: any;
}

export interface FormSelectOption extends FormlySelectOption {
    className?: string;
    classes?: string[] | string;
    id?: any;
}

export type FormSelectOptions = FormSelectOption[] | Observable<FormSelectOption[]>;

export interface IDynamicForm {

    readonly config: Signal<FormFieldConfig[]>;
    readonly group: Signal<FormGroup>;
    readonly status: Signal<DynamicFormState>;
    readonly onSubmit: OutputRef<IDynamicForm>;

}

// --- Validation types ---

type FormFieldValidatorFn<T> = ((control: AbstractControl, field?: FormlyFieldConfig) => T) & {validatorName?: string};

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

export type FormFieldCustom = Pick<FormFieldConfig, "wrappers" | "hooks" | "fieldGroup" | "fieldArray">;

export type FormFieldData = Pick<FormFieldProps, "label" | "readonly" | "hidden">
    & {
    validators?: Validators | ValidatorFn[];
    serializer?: FormFieldSerializer;
    fieldSet?: string;
    classes?: string[] | string;
};

export type FormInputData = FormFieldData
    & Pick<FormFieldProps, "type" | "pattern" | "placeholder" | "step" | "min" | "max" | "minLength" | "maxLength" | "autocomplete" | "formCheck" | "indeterminate" | "cols" | "rows">;

export type FormSelectData = FormFieldData
    & Pick<FormFieldProps, "multiple" | "type" | "inline" | "allowEmpty" | "groupBy"> & {
    options: (field: FormFieldConfig) => FormSelectOptions | Promise<FormSelectOption[]>;
};

export type FormUploadData = FormFieldData
    & Pick<FormFieldProps, "inline" | "multiple" | "accept" | "url" | "maxSize" | "uploadOptions" | "createUploadData" | "multi" | "asFile" | "uploadUrl">;

export type FormGroupData = FormFieldData;

export type FormArrayData = FormFieldData
    & Pick<FormFieldProps, "useTabs" | "tabsLabel" | "addItem" | "insertItem" | "cloneItem" | "moveItem" | "removeItem" | "clearItems">;

// --- JSON schema interfaces ---

export type FormFieldCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema, field: FormlyFieldConfig,
    path: string, options: FormBuilderOptions, injector: Injector
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
