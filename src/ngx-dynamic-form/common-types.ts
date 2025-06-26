import {Injector, OutputRef, Signal, Type} from "@angular/core";
import {AbstractControl, FormControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {ConfigOption, FormlyFieldConfig, FormlyFieldProps} from "@ngx-formly/core";
import {FormlySelectOption} from "@ngx-formly/core/select";
import {
    IAsyncMessage,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    IRequestOptions,
    MaybeArray,
    MaybePromise, TabOption
} from "@stemy/ngx-utils";

// --- Basic frm constants ---
export const FORM_ROOT_KEY = "__root";

// --- Basic form types ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";
export type UploadData = Record<string, any> | ArrayBuffer | FormData;

// --- Basic form field interfaces ---

export type FormFieldKey = string | number | (string | number)[];

export type FormFieldLabelCustomizer = (key: string, label: string, parent: FormFieldConfig, labelPrefix: string) => string;

export interface FormBuilderOptions {
    labelPrefix?: string;
    labelCustomizer?: FormFieldLabelCustomizer;
    testId?: string;
    context?: any;
}

export type FormFieldAdditional = Readonly<{[key: string]: any}>;

export interface FormFieldProps extends FormlyFieldProps {
    // --- Common props ---
    additional?: FormFieldAdditional;
    // --- Input props ---
    autocomplete?: string;
    suffix?: string;
    // --- Checkbox props ---
    formCheck?: string;
    indeterminate?: boolean;
    // --- Select props ---
    multiple?: boolean;
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
    inline?: boolean;
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

export type FormFieldSerializer = (field: FormFieldConfig, injector: Injector) => MaybePromise<any>;

export declare type FormHookFn = (field: FormFieldConfig) => any;

export interface FormHookConfig {
    onInit?: FormHookFn;
    onChanges?: FormHookFn;
    afterContentInit?: FormHookFn;
    afterViewInit?: FormHookFn;
    onDestroy?: FormHookFn;
}

export type FormFieldExpression<T = any> = string | ((field: FormFieldConfig) => T) | Observable<T>;
export type FormFieldExpressions = {
    [property: string]: FormFieldExpression;
} & {
    className?: FormFieldExpression<string>;
    hide?: FormFieldExpression<boolean>;
    "props.disabled"?: FormFieldExpression<boolean>;
    "props.required"?: FormFieldExpression<boolean>;
};

export interface FormFieldConfig<T = FormFieldProps> extends FormlyFieldConfig<T> {
    serializer?: FormFieldSerializer;
    serialize?: boolean;
    fieldSet?: string;
    parent?: FormFieldConfig;
    fieldGroup?: FormFieldConfig[];
    fieldArray?: FormFieldConfig | ((field: FormFieldConfig) => FormFieldConfig);
    hooks: FormHookConfig;
    expressions: FormFieldExpressions;
    readonly additional?: FormFieldAdditional;
    readonly tabs?: TabOption[];
    readonly path?: string;
    readonly testId?: string;
}

export interface FormFieldType<T = FormFieldProps> extends FormFieldConfig<T> {
    formControl: FormControl;
    props: NonNullable<T>;
}

export interface FormFieldChangeEvent {
    field: FormFieldConfig;
    type: string;
    value: any;
    [meta: string]: any;
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

    readonly fieldChanges: Observable<FormFieldChangeEvent>;
    readonly config: Signal<FormFieldConfig[]>;
    readonly group: Signal<FormGroup>;
    readonly status: Signal<DynamicFormState>;
    readonly onSubmit: OutputRef<IDynamicForm>;

    reset(): void;
}

// --- Validation types ---

type FormFieldValidatorFn<T> = ((control: AbstractControl, field?: FormlyFieldConfig) => T) & {
    validatorName?: string
};

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

export interface AllValidationErrors {
    control: AbstractControl;
    path: string;
    errorKey: string;
    errorValue: any;
}

// --- Form field data types ---

export type FormFieldCustom = Pick<FormFieldConfig, "wrappers" | "hooks" | "fieldGroup" | "fieldArray">;

export type FormFieldData = Pick<FormFieldProps, "label" | "hidden" | "disabled">
    & {
    validators?: Validators | ValidatorFn[];
    serializer?: FormFieldSerializer;
    serialize?: boolean;
    fieldSet?: string;
    componentType?: string | Type<any>;
    classes?: string[] | string;
};

export type FormInputData = FormFieldData
    & Pick<FormFieldProps, "type" | "pattern" | "placeholder" | "step" | "min" | "max" | "minLength" | "maxLength" | "autocomplete" | "suffix" | "indeterminate" | "cols" | "rows">;

export type FormSelectData = FormFieldData
    & Pick<FormFieldProps, "multiple" | "type" | "allowEmpty" | "groupBy"> & {
    options?: (field: FormFieldConfig) => FormSelectOptions | Promise<FormSelectOption[]>;
};

export type FormUploadData = FormFieldData
    & Pick<FormFieldProps, "inline" | "multiple" | "accept" | "url" | "maxSize" | "uploadOptions" | "createUploadData" | "multi" | "asFile" | "uploadUrl">;

export type FormGroupData = FormFieldData;

export type FormArrayData = FormFieldData
    & Pick<FormFieldProps, "useTabs" | "tabsLabel" | "addItem" | "insertItem" | "cloneItem" | "moveItem" | "removeItem" | "clearItems">;

// --- JSON schema interfaces ---

export type FormFieldCustomizer = (
    field: FormFieldConfig, options: FormBuilderOptions, injector: Injector,
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema
) => MaybePromise<MaybeArray<FormFieldConfig>>;

export interface ConfigForSchemaOptions extends FormBuilderOptions {
    fieldCustomizer?: FormFieldCustomizer;
}

export type CustomizerOrSchemaOptions = FormFieldCustomizer | ConfigForSchemaOptions;

export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export interface IDynamicFormModuleConfig {
    options?: ConfigOption[];
}
