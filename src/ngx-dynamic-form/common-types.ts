import {TemplateRef} from "@angular/core";
import {AbstractControl, FormArray, NgForm} from "@angular/forms";
import {Observable} from "rxjs";
import {DynamicValidatorsConfig, DynamicValidatorDescriptor, DynamicFormOptionConfig} from "@ng-dynamic-forms/core";
import {
    IAsyncMessage,
    IRequestOptions,
    IResolveFactory,
    ObjectUtils,
    ReflectUtils,
    UniqueUtils
} from "@stemy/ngx-utils";

// --- Basic form control interfaces ---

export type IFormControlSerializer = (id: string, parent: AbstractControl) => Promise<any>;
export type IFormInputMask = string | RegExp;
export type IFormInputMaskFunction = (raw: string) => IFormInputMask[];
export type IFormInputUnMaskFunction = (value: string) => any;

export interface IFormSerializer {
    id: string;
    func: IFormControlSerializer;
}

export interface IFormSerializers {
    [id: string]: IFormControlSerializer | IResolveFactory | null
}

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

export interface IFormControl {
    id: string;
    type: string;
    visible?: boolean;
    data?: IFormControlData;
}

export interface IFormControlData {
    label?: string;
    labelAlign?: string;
    fieldSet?: string;
    classes?: string;
    readonly?: FormControlTesterFactory;
    hidden?: FormControlTesterFactory;
    shouldSerialize?: FormControlTesterFactory;
    shouldValidate?: FormControlTesterFactory;
    validator?: DynamicValidatorDescriptor;
    validators?: DynamicValidatorsConfig;
    updateOn?: DynamicFormUpdateOn;
    reload?: string | string[];
}

export interface IFormInputData extends IFormControlData {
    type?: string;
    autocomplete?: string;
    placeholder?: string;
    useLanguage?: boolean;
    mask?: IFormInputMaskFunction | IFormInputMask[];
    unmask?: IFormInputUnMaskFunction;
    step?: number;
    min?: number;
    max?: number;
}

export interface IFormSelectData extends IFormControlData {
    options?: DynamicFormOptionConfig<any>[] | Observable<DynamicFormOptionConfig<any>[]>;
    emptyOption?: boolean;
    type?: string;
    multi?: boolean;
}

export interface IFormStaticData extends IFormControlData {
    properties?: string[];
    style?: string;
}

export interface IFormFileData extends IFormControlData {
    accept?: string;
    multi?: boolean;
    baseUrl?: string;
    asFile?: boolean;
    asDataUrl?: boolean;
    uploadUrl?: string;
    uploadOptions?: IRequestOptions;
    createUploadData?: (file: File) => any;
}

export interface IFormModelData extends IFormControlData, IDynamicFormInfo {

}

export interface IFormFieldSet {
    id: string;
    classes?: string;
    title?: string;
    titleClasses?: string;
    setClasses?: string;
    controlClasses?: string;
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
    controlData?: IFormControlData;
    multi?: false;
}

export interface IDynamicMultiFormConfig extends IDynamicFormConfig {
    data: IDynamicFormsConfigs;
    multi: true;
}

export type IDynamicFormsConfigs = Array<IDynamicSingleFormConfig | IDynamicMultiFormConfig>;

export declare type AsyncSubmitMethod = (form: NgForm) => Promise<IAsyncMessage>;

export interface IDynamicFormInfo {
    name?: string;
    controls?: IFormControl[];
    serializers?: IFormSerializers;
    fieldSets?: IFormFieldSet[];
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

// --- Basic form types ---
export type FormControlTester = (control: AbstractControl) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;

// --- Decorator functions ---
const emptyArray: any = [];
const emptyTester: FormControlTester = () => {
    return Promise.resolve(false);
};

export function defaultSerializer(id: string, parent: FormArray): Promise<any> {
    const control = parent.get(id);
    return !control ? null: control.value;
}

export function FormSerializable(serializer?: IFormControlSerializer | IResolveFactory): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        ReflectUtils.defineMetadata("dynamicFormSerializer", serializer || defaultSerializer, target, propertyKey);
    };
}

export function FormInput(data?: IFormInputData): PropertyDecorator {
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

export function FormSelect(data?: IFormSelectData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormSelect(propertyKey, data));
    };
}

export function FormStatic(data?: IFormStaticData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormStatic(propertyKey, data));
    };
}

export function FormModel(data?: IFormModelData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormModel(propertyKey, data));
    };
}

export function FormFile(data?: IFormFileData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        defineFormControl(target, propertyKey, createFormFile(propertyKey, data));
    };
}

export function FormFieldSet(data: IFormFieldSet): ClassDecorator {
    return (target: any): void => {
        const sets = getFormFieldSets(target);
        data.classes = data.classes || "";
        sets[data.id] = data;
        ReflectUtils.defineMetadata("dynamicFormFieldSets", sets, target);
    };
}

export function defineFormControl(target: any, propertyKey: string, control: IFormControl): void {
    ReflectUtils.defineMetadata("dynamicFormControl", control, target, propertyKey);
}

export function getFormFieldSets(target: any): IDynamicFormFieldSets {
    return ReflectUtils.getMetadata("dynamicFormFieldSets", target) || {};
}

export function getFormControl(target: any, propertyKey: string): IFormControl {
    return ReflectUtils.getMetadata("dynamicFormControl", target, propertyKey);
}

export function getFormSerializer(target: any, propertyKey: string): IFormControlSerializer | IResolveFactory {
    return ReflectUtils.getMetadata("dynamicFormSerializer", target, propertyKey);
}

export function createFormControl(id: string, type: string, data?: IFormControlData): IFormControl {
    data = data || {};
    data.label = ObjectUtils.isNullOrUndefined(data.label) ? id : data.label;
    data.labelAlign = data.labelAlign || "left";
    data.fieldSet = data.fieldSet || UniqueUtils.uuid();
    data.classes = data.classes || "";
    data.readonly = data.readonly || emptyTester;
    data.hidden = data.hidden || emptyTester;
    data.validators = data.validators || emptyArray;
    return {
        id: id,
        type: type,
        data: data
    };
}

export function createFormInput(id: string, data: IFormInputData, type: string = "text"): IFormControl {
    const control = createFormControl(id, "input", data);
    data = control.data;
    data.type = data.type || type;
    data.classes = !data.classes ? `form-group-${data.type}` : `${data.classes} form-group-${data.type}`;
    data.placeholder = data.placeholder || (data.type == "mask" ? "_" : "");
    data.step = data.step || 1;
    data.mask = data.mask || [/\w*/gi];
    return control;
}

export function createFormSelect(id: string, data: IFormSelectData): IFormControl {
    const control = createFormControl(id, "select", data);
    data = control.data;
    data.options = data.options || [];
    data.type = data.type || "select";
    const classType = data.type == "select" ? "select" : `select-${data.type}`;
    data.classes = !data.classes ? `form-group-${classType}` : `${data.classes} form-group-${classType}`;
    return control;
}

export function createFormStatic(id: string, data: IFormStaticData): IFormControl {
    const control = createFormControl(id, "static", data);
    data = control.data;
    data.style = data.style || "table";
    return control;
}

export function createFormModel(id: string, data: IFormModelData): IFormControl {
    const control = createFormControl(id, "model", data);
    data = control.data;
    data.name = data.name || "";
    return control;
}

export function createFormFile(id: string, data: IFormFileData): IFormControl {
    const control = createFormControl(id, "file", data);
    data = control.data;
    data.accept = data.accept || ".jpg,.jpeg,.png";
    data.multi = data.multi || false;
    data.baseUrl = ObjectUtils.isString(data.baseUrl) ? data.baseUrl : "assets/";
    data.uploadUrl = ObjectUtils.isString(data.uploadUrl) ? data.uploadUrl : "assets";
    data.createUploadData = data.createUploadData || ((file: File) => {
        const form = new FormData();
        form.append("file", file);
        return form;
    });
    return control;
}
