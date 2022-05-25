import {EventEmitter, Injector, TemplateRef} from "@angular/core";
import {AbstractControl, FormArray} from "@angular/forms";
import {
    DynamicFileUploadModelConfig,
    DynamicFormControl,
    DynamicFormControlEvent,
    DynamicFormControlMapFn,
    DynamicFormControlModel,
    DynamicFormControlModelConfig,
    DynamicFormGroupModelConfig,
    DynamicFormValueControlModel,
    DynamicInputModelConfig,
    DynamicSelectModelConfig
} from "@ng-dynamic-forms/core";
import {
    IAsyncMessage,
    IOpenApiSchema,
    IOpenApiSchemaProperty,
    IResolveFactory,
    ObjectUtils,
    ReflectUtils
} from "@stemy/ngx-utils";

// --- Basic form control interfaces ---

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

export interface IDynamicFormEvent extends DynamicFormControlEvent {
    form: IDynamicForm;
}

export interface IDynamicForm {
    status: DynamicFormState;

    onValueChange: EventEmitter<IDynamicFormEvent>;
    onStatusChange: EventEmitter<IDynamicForm>;
    onSubmit: EventEmitter<IDynamicForm>;

    validate(): Promise<any>;
    serialize(validate?: boolean): Promise<any>;
}

export interface OnCreatedFormControl extends DynamicFormControl {
    onCreated(): any;
}

export declare interface ModelType extends Function {
    new (config: DynamicFormControlModelConfig): DynamicFormControlModel;
}

export type FormControlSerializer = (model: DynamicFormValueControlModel<any>, control: AbstractControl) => Promise<any>;
export type FormModelCustomizer = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    model: DynamicFormControlModel, config: DynamicFormControlModelConfig, injector: Injector
) => DynamicFormControlModel | DynamicFormControlModel[];
export type FormModelCustomizerWrap = (
    property: IOpenApiSchemaProperty, schema: IOpenApiSchema,
    modelType: ModelType, config: DynamicFormControlModelConfig
) => DynamicFormControlModel[];

export interface IFormControl {
    id: string;
    type: string;
    config?: DynamicFormControlModelConfig;
}

export interface IFormControlOption {
    id: any;
    label: string;
    selectable?: boolean;
}

// --- Basic form interfaces ---

export interface IDynamicFormTemplates {
    [id: string]: TemplateRef<any>;
}

export interface IDynamicFormConfig {
    path?: string | number | Array<string | number>;
    name?: string;
    classes?: string;
    formClasses?: string;
    innerFormClasses?: string;
    id: string;
}

export interface IDynamicSingleFormConfig extends IDynamicFormConfig, IDynamicFormInfo {
    data: any;
    controlData?: DynamicFormGroupModelConfig;
    multi?: false;
}

export interface IDynamicMultiFormConfig extends IDynamicFormConfig {
    data: IDynamicFormsConfigs;
    multi: true;
}

export type IDynamicFormsConfigs = Array<IDynamicSingleFormConfig | IDynamicMultiFormConfig>;

export declare type AsyncSubmitMethod = (form: IDynamicForm, context?: any) => Promise<IAsyncMessage>;

export interface IDynamicFormInfo {
    name?: string;
    controls?: IFormControl[];
}

// --- Decorator functions ---
export function defaultSerializer(id: string, parent: FormArray): Promise<any> {
    const control = parent.get(id);
    return !control ? null: control.value;
}

export function FormSerializable(serializer?: FormControlSerializer | IResolveFactory): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        ReflectUtils.defineMetadata("dynamicFormSerializer", serializer || defaultSerializer, target, propertyKey);
    };
}

export function FormInput(data?: DynamicInputModelConfig): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        const meta = ReflectUtils.getOwnMetadata("design:type", target, propertyKey);
        const type = meta ? meta.name : "";
        let inputType = propertyKey.indexOf("password") < 0 ? "text" : "password";
        switch (type) {
            case "Number":
                inputType = "number";
                break;
            case "Boolean":
                inputType = "checkbox";
                break;
        }
        defineFormControl(target, propertyKey, createFormInput(propertyKey, data, inputType));
    };
}

export function FormSelect(data?: DynamicSelectModelConfig<any>): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormSelect(propertyKey, data));
    };
}

export function FormStatic(data?: DynamicFormControlModelConfig): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormStatic(propertyKey, data));
    };
}

export function FormModel(data?: DynamicFormGroupModelConfig): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormModel(propertyKey, data));
    };
}

export function FormFile(data?: DynamicFileUploadModelConfig): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormFile(propertyKey, data));
    };
}

export function defineFormControl(target: any, propertyKey: string, control: IFormControl): void {
    ReflectUtils.defineMetadata("dynamicFormControl", control, target, propertyKey);
}

export function getFormControl(target: any, propertyKey: string): IFormControl {
    return ReflectUtils.getMetadata("dynamicFormControl", target, propertyKey);
}

export function getFormSerializer(target: any, propertyKey: string): FormControlSerializer | IResolveFactory {
    return ReflectUtils.getMetadata("dynamicFormSerializer", target, propertyKey);
}

export function createFormControl(id: string, type: string, config?: DynamicFormControlModelConfig): IFormControl {
    config = config || {id};
    config.id = id;
    config.label = ObjectUtils.isNullOrUndefined(config.label) ? id : config.label;
    config.disabled = config.disabled || false;
    config.hidden = config.hidden || false;
    return {id, type, config};
}

export function createFormInput(id: string, config: DynamicInputModelConfig, type: string = "text"): IFormControl {
    const control = createFormControl(id, "input", config);
    config = control.config;
    config.inputType = config.inputType || type;
    config.placeholder = config.placeholder || (config.inputType == "mask" ? "_" : "");
    config.step = config.step || 1;
    config.mask = config.mask || null;
    return control;
}

export function createFormSelect(id: string, data: DynamicSelectModelConfig<any>): IFormControl {
    const control = createFormControl(id, "select", data);
    data = control.config;
    data.options = data.options || [];
    return control;
}

export function createFormStatic(id: string, config: DynamicFormControlModelConfig): IFormControl {
    return createFormControl(id, "static", config);
}

export function createFormModel(id: string, data: DynamicFormGroupModelConfig): IFormControl {
    const control = createFormControl(id, "group", data);
    data = control.config;
    data.name = data.name || "";
    return control;
}

export function createFormFile(id: string, data: DynamicFileUploadModelConfig): IFormControl {
    const control = createFormControl(id, "file", data);
    data = control.config;
    data.accept = data.accept || ["jpg", "jpeg", "png"];
    data.multiple = data.multiple || false;
    data.url = ObjectUtils.isString(data.url) ? data.url : "assets";
    return control;
}

export interface IDynamicFormModuleConfig {
    controlProvider?: (injector: Injector) => DynamicFormControlMapFn;
}
