import {Injector, OutputRef, Signal, Type} from "@angular/core";
import {AbstractControl, FormControl, FormGroup} from "@angular/forms";
import {Observable} from "rxjs";
import {ConfigOption, FormlyFieldConfig, FormlyFieldProps} from "@ngx-formly/core";
import {FormlySelectOption} from "@ngx-formly/core/select";
import {
    IAsyncMessage,
    OpenApiSchema,
    OpenApiSchemaProperty,
    HttpRequestOptions,
    MaybeArray,
    MaybePromise,
    UploadData, ResolveFactory, UnorderedListStyle
} from "@stemy/ngx-utils";

// --- Basic frm constants ---
export const FORM_ROOT_ID = "__root";

// --- Basic form types ---

export type DynamicFormStatus = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

// --- Basic form field interfaces ---

export type FormFieldKey = string | number | (string | number)[];

export type FormFieldLabelCustomizer = (key: string, label: string, parent: FormFieldConfig, labelPrefix: string) => string;

export interface FormBuilderOptions {
    labelPrefix?: string;
    labelCustomizer?: FormFieldLabelCustomizer;
    testId?: string;
    context?: any;
}

/**
 * This type describes how one of the array actions should react based on an array item
 */
export type FormFieldArrayItemsAction = boolean | ((item: any, ix: number, field: FormFieldConfig) => boolean);

/**
 * This interface describes what properties each form field component can have.
 */
export interface FormFieldProps extends FormlyFieldProps {
    /**
     * It specifies where the label should be placed. (default: before)
     */
    labelAlign?: "before" | "after";
    /**
     * Specifies if required marker should be hidden
     */
    hideRequiredMarker?: boolean;
    /**
     * Specifies if label should be hidden
     */
    hideLabel?: boolean;
    /**
     * Custom class name(s) can be defined for a form field
     */
    classes?: string[] | string;
    /**
     * Custom class name(s) can be defined for a form field, but they get prefixed by `dynamic-form-layout-`
     */
    layout?: string[] | string;
    /**
     * This custom class name overrides the whole class list of the form field
     */
    className?: string;
    /**
     * In the input component, define how the browser should automatically fill in the field value.
     */
    autocomplete?: string;
    /**
     * In the number type input component, you specify what text to add at the end, e.g., some unit of measurement
     */
    suffix?: string;
    /**
     * In a checkbox type component, it specifies where the label should be placed. (Bootstrap library specific)
     */
    formCheck?: string;
    /**
     * Specifies that the value of the checkbox type component can be undecided.
     */
    indeterminate?: boolean;
    /**
     * Specifies that multiple values can be selected at once in the select component.
     */
    multiple?: boolean;
    /**
     * Specifies that the input balue does not have to be in the options of chips component if false (default: true)
     */
    strict?: boolean;
    /**
     * Allows empty, null values in the select component
     */
    allowEmpty?: boolean;
    /**
     * Groups the selectable values based on the value of the specified key in the select component
     */
    groupBy?: string;
    /**
     * Inverts the display of selected values in the select component
     */
    invert?: boolean;
    /**
     * For group and array type components, specifies whether the field hides groups or array elements under tabs and always displays only the selected element.
     */
    useTabs?: boolean;
    /**
     * In the case of an array type component, it specifies the key from which each element to extract the text displayed on the tab.
     * If not specified or the value is undefined, it is replaced with the index of the array element.
     */
    tabsLabel?: string;
    /**
     * Specifies whether new elements can be inserted into existing elements of an array component.
     */
    insertItem?: FormFieldArrayItemsAction;
    /**
     * Specifies whether an existing element of an array type component can be cloned.
     */
    cloneItem?: FormFieldArrayItemsAction;
    /**
     * Specifies whether an existing element of an array type component can be moved.
     */
    moveItem?: FormFieldArrayItemsAction;
    /**
     * Specifies whether an existing element of an array type component can be deleted.
     */
    removeItem?: FormFieldArrayItemsAction;
    /**
     * Specifies whether a new element can be added to the array type component.
     */
    addItem?: boolean;
    /**
     * Specifies whether all the items can be removed from the array type component.
     */
    clearItems?: boolean;
    /**
     * Defines what properties should we display in static type component
     */
    properties?: string[];
    /**
     * Defines what style should we use in static type component
     */
    style?: UnorderedListStyle;
    /**
     * An array of weekdays to be disabled in calendar
     */
    daysDisabled?: number[];
    /**
     * Specifies that the file upload component value is stored inline, so instead of an API call, the file Blob is inserted into the field value.
     */
    inline?: boolean;
    /**
     * Specifies what types of files the file upload component can accept. (.jpg, .png)
     */
    accept?: string | string[];
    url?: string;
    maxSize?: number;
    uploadOptions?: HttpRequestOptions;
    createUploadData?: (file: File) => UploadData | Promise<UploadData>;
    /**
     * Old upload props
     */
    multi?: boolean;
    asFile?: boolean;
    uploadUrl?: string;
    /**
     * Angular material specific props
     */
    floatLabel?: "always" | "auto";
    appearance?: "fill" | "outline";
    subscriptSizing?: "fixed" | "dynamic";
    color?: "primary" | "accent" | "warn";
    hideFieldUnderline?: boolean;
    /**
     * Specifies if required marker should be shown
     */
    markRequired?: boolean;
    /**
     * Additional custom field props
     */
    [additionalProperties: string]: any;
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
    "props.hidden"?: FormFieldExpression<boolean>;
    "props.required"?: FormFieldExpression<boolean>;
};

export interface FormFieldConfig<T = FormFieldProps> extends FormlyFieldConfig<T> {
    serializer?: FormFieldSerializer;
    serialize?: boolean;
    fieldSet?: string;
    priority?: number;
    fieldGroup?: FormFieldConfig[];
    fieldArray?: FormFieldConfig;
    hooks: FormHookConfig;
    expressions: FormFieldExpressions;
    readonly parent?: FormFieldConfig;
    readonly display?: boolean;
    readonly valid?: boolean;
    readonly path?: string;
    readonly testId?: string;
    [additionalProperties: string]: any;
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

export interface FormSelectOption extends Omit<FormlySelectOption, "group"> {
    className?: string;
    classes?: string[] | string;
    id?: any;
    [key: string]: any;
}

export type FormSelectOptions = FormSelectOption[] | Observable<FormSelectOption[]> | Promise<FormSelectOption[]>;

export type FormSelectOptionsFactory = (field: FormFieldConfig, injector: Injector) => FormSelectOptions;

export type FormFieldConditionFn = (field: FormFieldConfig, injector: Injector) => boolean;

export type FormFieldCondition = FormFieldConditionFn | boolean;

export interface IDynamicForm {

    readonly fieldChanges: Observable<FormFieldChangeEvent>;
    readonly config: Signal<FormFieldConfig[]>;
    readonly group: Signal<FormGroup>;
    readonly status: Signal<DynamicFormStatus>;
    readonly onSubmit: OutputRef<IDynamicForm>;
    readonly onChanges: OutputRef<FormFieldChangeEvent>;

    reset(): void;
    serialize(validate?: boolean): Promise<any>;
    getField(path: string): FormFieldConfig;
    getControl(path: string): AbstractControl;
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

export type FormFieldData = Pick<FormFieldProps, "label" | "labelAlign" | "description" | "hideRequiredMarker" | "hideLabel" | "classes" | "layout" | "className">
    & {
    /**
     * Conditional check if the field should be hidden or not
     */
    hidden?: FormFieldCondition | ResolveFactory<FormFieldCondition>;
    /**
     * Conditional check if the field should be disabled or not
     */
    disabled?: FormFieldCondition | ResolveFactory<FormFieldCondition>;
    /**
     * This is a custom serializer callback function. (Can't be defined from JSON schema because it is a JS callback)
     */
    serializer?: FormFieldSerializer;
    /**
     * Enables normal serialization even if the field is hidden
     */
    serialize?: boolean;
    /**
     * Puts the field in a custom field set
     */
    fieldSet?: string;
    /**
     * Puts the field in a custom order
     */
    priority?: number;
    /**
     * The used component type of the field can be overridden, (Only string can be defined from JSON schema)
     */
    componentType?: string | Type<any>;
    /**
     * Custom wrappers for a form field. (Only pre-defined string wrappers can be defined from JSON schema)
     */
    wrappers?: Array<Type<any> | string>;
    /**
     * Any additional property for a form field (These gets applied before the type-specific props)
     */
    props?: Record<string, any>;
    /**
     * Custom validators for a form field.
     */
    validators?: Validators | ValidatorFn[];
};

export type FormInputData = FormFieldData
    & Pick<FormFieldProps, "type" | "pattern" | "placeholder" | "step" | "minLength" | "maxLength" | "autocomplete" | "suffix" | "indeterminate" | "cols" | "rows" | "daysDisabled"> & {
    min?: number | Date;
    max?: number | Date;
};

export type FormSelectData = FormFieldData
    & Pick<FormFieldProps, "multiple" | "strict" | "type" | "allowEmpty" | "groupBy" | "invert"> & {
    options?: ResolveFactory<FormSelectOptionsFactory> | FormSelectOptionsFactory;
};

export type FormStaticData = FormFieldData
    & Pick<FormFieldProps, "properties" | "style">;

export type FormUploadData = FormFieldData
    & Pick<FormFieldProps, "inline" | "multiple" | "accept" | "url" | "maxSize" | "uploadOptions" | "createUploadData" | "multi" | "asFile" | "uploadUrl">;

export type FormGroupData = FormFieldData & Pick<FormFieldProps, "useTabs">;

export type FormArrayData = FormFieldData
    & Pick<FormFieldProps, "useTabs" | "tabsLabel" | "insertItem" | "cloneItem" | "moveItem" | "removeItem" | "addItem" | "clearItems">;

// --- Async submit ---

export type AsyncSubmitMode = "click" | "submit" | "all";
export type AsyncSubmitMethod = (form: IDynamicForm, context?: any, ev?: MouseEvent) => Promise<IAsyncMessage>;

// --- JSON schema interfaces ---

export type FormFieldCustomizer = (
    field: FormFieldConfig, options: FormBuilderOptions, injector: Injector,
    property: OpenApiSchemaProperty, schema: OpenApiSchema
) => MaybePromise<MaybeArray<FormFieldConfig>>;

export interface ConfigForSchemaOptions extends FormBuilderOptions {
    fieldCustomizer?: FormFieldCustomizer;
}

export type CustomizerOrSchemaOptions = FormFieldCustomizer | ConfigForSchemaOptions;

export interface IDynamicFormModuleConfig {
    options?: ConfigOption[];
}
