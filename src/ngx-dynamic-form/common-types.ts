import {ChangeDetectorRef, EventEmitter, Injector, Type} from "@angular/core";
import {AbstractControl, FormGroup} from "@angular/forms";
import {
    DynamicFileUploadModel,
    DynamicFileUploadModelConfig,
    DynamicFormControl,
    DynamicFormControlComponent,
    DynamicFormControlEvent,
    DynamicFormControlMapFn,
    DynamicFormControlModel,
    DynamicFormControlModelConfig,
    DynamicFormGroupModel,
    DynamicFormGroupModelConfig,
    DynamicFormValueControlModel,
    DynamicInputModel,
    DynamicInputModelConfig,
    DynamicSelectModelConfig,
    DynamicFormControlLayout,
    DynamicCheckboxModel,
    DynamicCheckboxModelConfig,
    DynamicDatePickerModel,
    DynamicDateControlModel
} from "@ng-dynamic-forms/core";
import {IAsyncMessage, IOpenApiSchema, IOpenApiSchemaProperty, ObjectUtils} from "@stemy/ngx-utils";
import {DynamicSelectModel} from "./utils/dynamic-select.model";
import {DynamicEditorModel, DynamicEditorModelConfig} from "./utils/dynamic-editor.model";
import {DynamicFormArrayModelConfig} from "./utils/dynamic-form-array.model";

// --- Basic form control interfaces ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

export interface IDynamicFormEvent extends DynamicFormControlEvent {
    form: IDynamicForm;
}

export interface IDynamicForm {

    readonly group: FormGroup;

    status: DynamicFormState;

    onValueChange: EventEmitter<IDynamicFormEvent>;
    onStatusChange: EventEmitter<IDynamicForm>;
    onSubmit: EventEmitter<IDynamicForm>;

    validate(): Promise<any>;
    serialize(validate?: boolean): Promise<any>;
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
    modelType: ModelType, config: DynamicFormControlModelConfig
) => Promise<DynamicFormControlModel[]>;

export interface IFormControl {
    id: string;
    type: string;
    config?: DynamicFormControlModelConfig;
}

export interface DynamicFormInitControl extends DynamicFormControl {
    initialize(cdr?: ChangeDetectorRef): void;
}

export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export type GetFormControlComponentType = (model: DynamicFormControlModel) => Type<DynamicFormControlComponent>;

export interface IDynamicFormModuleConfig {
    controlProvider?: (injector: Injector) => DynamicFormControlMapFn;
}
