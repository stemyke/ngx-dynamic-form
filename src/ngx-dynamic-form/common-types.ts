import {ChangeDetectorRef, EventEmitter, Injector, Type} from "@angular/core";
import {AbstractControl} from "@angular/forms";
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
export type FormControlSerializer = (model: DynamicFormValueControlModel<any>, control: AbstractControl) => Promise<any>;
export type FormModelCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    model: DynamicFormControlModel, config: DynamicFormControlModelConfig, injector: Injector
) => PromiseOrNot<DynamicFormControlModel | DynamicFormControlModel[]>;
export type FormModelCustomizerWrap = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    modelType: ModelType, config: DynamicFormControlModelConfig, path: string
) => Promise<DynamicFormControlModel[]>;

export interface IModelForSchemaOptions {
    labelPrefix?: string;
    customizer?: FormModelCustomizer;
}

export interface DynamicFormInitControl extends DynamicFormControl {
    initialize(cdr?: ChangeDetectorRef): void;
}

export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export type GetFormControlComponentType = (model: DynamicFormControlModel, injector: Injector) => Type<DynamicFormControlComponent>;

export interface IDynamicFormModuleConfig {
    controlProvider?: (injector: Injector) => DynamicFormControlMapFn;
}
