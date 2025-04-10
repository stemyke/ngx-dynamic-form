import {ChangeDetectorRef, EventEmitter, Injector, Type} from "@angular/core";
import {AbstractControl} from "@angular/forms";
import {Observable} from "rxjs";
import {
    DynamicFormControl,
    DynamicFormControlComponent,
    DynamicFormControlEvent,
    DynamicFormControlMapFn,
    DynamicFormControlModel,
    DynamicFormControlModelConfig,
    DynamicFormValueControlModel,
    DynamicFormComponent
} from "@ng-dynamic-forms/core";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {IAsyncMessage, IOpenApiSchema, IOpenApiSchemaProperty} from "@stemy/ngx-utils";

// --- Basic form control interfaces ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

export interface IDynamicFormEvent extends DynamicFormControlEvent {
    form: IDynamicForm;
}

export interface IDynamicForm extends DynamicFormComponent {

    status?: DynamicFormState;

    onValueChange?: EventEmitter<IDynamicFormEvent>;
    onStatusChange?: EventEmitter<IDynamicForm>;
    onSubmit?: EventEmitter<IDynamicForm>;
}

export declare interface ModelType extends Function {
    new (config: DynamicFormControlModelConfig): DynamicFormControlModel;
}

export type PromiseOrNot<T> = Promise<T> | T;

// --- OLD UDOS ---

export type FormControlSerializer = (model: DynamicFormValueControlModel<any>, control: AbstractControl) => Promise<any>;
export type FormModelCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    model: DynamicFormControlModel, config: DynamicFormControlModelConfig, path: string, injector: Injector
) => PromiseOrNot<DynamicFormControlModel | DynamicFormControlModel[]>;

export interface ModelForSchemaOptions {
    labelPrefix?: string;
    customizer?: FormModelCustomizer;
}

export interface ModelForSchemaWrapOptions extends Omit<ModelForSchemaOptions, "customizer"> {
    schema: IOpenApiSchema;
    customizer?: (
        property: IOpenApiSchemaProperty, options: ModelForSchemaWrapOptions,
        modelType: ModelType, config: DynamicFormControlModelConfig, path: string
    ) => Promise<DynamicFormControlModel[]>;
}

// --- NEW FORMLY ---

export type FormlyFieldCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    field: FormlyFieldConfig, path: string, injector: Injector
) => PromiseOrNot<DynamicFormControlModel | DynamicFormControlModel[]>;

export interface ConfigForSchemaOptions {
    labelPrefix?: string;
    customizer?: FormlyFieldCustomizer;
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

// --- NOT CHANGED ---

export interface DynamicFormInitControl extends DynamicFormControl {
    initialize(cdr?: ChangeDetectorRef): void;
}

export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export type GetFormControlComponentType = (model: DynamicFormControlModel, injector: Injector) => Type<DynamicFormControlComponent>;

export interface IDynamicFormModuleConfig {
    controlProvider?: (injector: Injector) => DynamicFormControlMapFn;
}
