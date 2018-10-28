import {EventEmitter, HostBinding, InjectionToken, Injector, TemplateRef, Type, ValueProvider} from "@angular/core";
import {IResolveFactory, ObjectUtils, ReflectUtils, UniqueUtils} from "@stemy/ngx-utils";

export const FORM_CONTROL_PROVIDER: InjectionToken<IFormControlProvider> = new InjectionToken<IFormControlProvider>("forn-control-provider");

// --- Basic form control interfaces ---
export interface IFormControlComponent {
    handler: IDynamicFormControlHandler;
}

export abstract class FormControlComponent<T extends IFormControlData> implements IFormControlComponent {

    handler: IDynamicFormControlHandler;

    get form(): IDynamicForm {
        return this.handler ? this.handler.form : null;
    }

    get data(): T {
        return this.control ? <T>this.control.data : null;
    }

    get control(): IFormControl {
        return this.handler.control;
    }

    get value(): any {
        return this.form && this.form.data && this.control ? this.form.data[this.control.id] : null;
    }

    get meta(): any {
        return this.handler ? this.handler.meta : null;
    }

    @HostBinding("class.form-input")
    get inputClass(): boolean {
        return true;
    }
}

export type IFormControlProviderAcceptor = (control: IFormControl) => boolean;
export type IFormControlProviderLoader = (control: IFormControl, form: IDynamicForm, meta: any) => Promise<any>;
export type IFormControlOptions = (control: IFormControl, form: IDynamicForm) => Promise<IFormControlOption[]>;
export type IFormControlSerializer = (id: string, form: IDynamicForm) => Promise<any>;
export type IFormInputMask = string | RegExp;
export type IFormInputMaskFunction = (raw: string) => IFormInputMask[];
export type IFormInputUnMaskFunction = (value: string) => any;

export interface IFormControlProvider {
    component: Type<IFormControlComponent>;
    priority: number;
    acceptor: IFormControlProviderAcceptor;
    loader: IFormControlProviderLoader;
}

export interface IFormSerializer {
    id: string;
    func: IFormControlSerializer;
}

export interface IFormControl {
    id: string;
    type: string;
    data?: IFormControlData;
}

export interface IFormControlData {
    label?: string;
    labelAlign?: string;
    fieldSet?: string;
    classes?: string;
    readonly?: FormControlTesterFactory;
    hidden?: FormControlTesterFactory;
    validator?: FormControlValidatorFactory;
    validators?: FormControlValidatorFactory[];
    reload?: string | string[];
}

export interface IFormInputData extends IFormControlData {
    type?: string;
    autocomplete?: string;
    placeholder?: string;
    mask?: IFormInputMaskFunction | IFormInputMask[];
    unmask?: IFormInputUnMaskFunction;
    step?: number;
    min?: number;
    max?: number;
}

export interface IFormSelectData extends IFormControlData {
    options?: IFormControlOptions | IResolveFactory;
    emptyOption?: boolean;
    type?: string;
    multi?: boolean;
}

export interface IFormStaticData extends IFormControlData {
    properties?: string[];
    style?: string;
}

export interface IFormModelData extends IFormControlData {
    controls?: IFormControl[];
    name?: string;
}

export interface IFormFieldSet {
    id: string;
    title?: string;
    classes?: string;
}

export interface IFormControlOption {
    id: any;
    label: string;
}

// --- Basic form interfaces ---

export interface IDynamicFormControlHandler {
    form: IDynamicForm;
    control: IFormControl;
    meta: any;
    errors: string[];
    hasErrors: boolean;
    isValid: boolean;
    isReadOnly: boolean;
    isVisible: boolean;
    isHidden: boolean;
    onFocus(): void;
    onBlur(): void
    onValueChange(value: any): void;
    load(): Promise<any>;
    check(): Promise<any>;
    validate(clearErrors?: boolean): Promise<boolean>;
}

export interface IDynamicFormTemplates {
    [id: string]: TemplateRef<any>;
}

export interface IDynamicFormConfig {
    path?: string;
    name?: string;
    controls?: IFormControl[];
    fieldSets?: IFormFieldSet[];
    classes?: string;
    formClasses?: string;
    innerFormClasses?: string;
    id: string;
    data: any;
}

export interface IDynamicFormBase {

    name: string;
    readonly: boolean;
    validateOnBlur: boolean;
    classes: string;
    parent: IDynamicFormBase;

    controlTemplate: TemplateRef<any>;
    controlTemplates: IDynamicFormTemplates;
    labelTemplates: IDynamicFormTemplates;
    inputTemplates: IDynamicFormTemplates;
    prefixTemplates: IDynamicFormTemplates;
    suffixTemplates: IDynamicFormTemplates;

    onChange: EventEmitter<IDynamicFormControlHandler>;
    onValidate: EventEmitter<Promise<IDynamicForm>>;
    onInit: EventEmitter<IDynamicForm>;
    onSubmit: EventEmitter<IDynamicForm>;

    isLoading: boolean;
    isValid: boolean;
    isValidating: boolean;

    validate(): Promise<any>;
    serialize(validate?: boolean): Promise<any>;
    emitChange(handler: IDynamicFormControlHandler): void;
}

export interface IDynamicForm extends IDynamicFormBase {

    controls: IFormControl[];
    fieldSets: IFormFieldSet[];
    data: any;

    id: any;
    prefix: string;
    injector: Injector;

    reloadControls(): Promise<any>;
    getControl(id: string): IFormControl;
    getControlHandler(id: string): IDynamicFormControlHandler;
    addControlHandler(handler: IDynamicFormControlHandler);
    removeControlHandler(handler: IDynamicFormControlHandler);
    recheckControls(): Promise<any>;
    reloadControlsFrom(handler: IDynamicFormControlHandler, handlers?: Set<IDynamicFormControlHandler>): Promise<any>;
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

// --- Basic form types ---
export type FormControlTester = (control: IFormControl, form: IDynamicForm) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;
export type FormControlValidator = (control: IFormControl, form: IDynamicForm) => Promise<string>;
export type FormControlValidatorFactory = FormControlValidator | IResolveFactory;

// --- Decorator functions ---
const emptyArray: any = [];
const emptyTester: FormControlTester = () => {
    return Promise.resolve(false);
};

export function defaultSerializer(id: string, form: IDynamicForm): Promise<any> {
    const handler = form.getControlHandler(id);
    if (!handler || !ObjectUtils.isFunction(handler.meta.serializer)) return Promise.resolve(form.data[id]);
    return handler.meta.serializer();
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

export function FormFieldSet(data: IFormFieldSet): ClassDecorator {
    return (target: any): void => {
        const sets = getFormFieldSets(target);
        data.classes = data.classes || "";
        sets[data.id] = data;
        ReflectUtils.defineMetadata("dynamicFormFieldSets", sets, target);
    };
}

export function provideFormControl(component: Type<IFormControlComponent>, acceptor: IFormControlProviderAcceptor, loader: IFormControlProviderLoader, priority: number = 0): ValueProvider {
    return {
        provide: FORM_CONTROL_PROVIDER,
        multi: true,
        useValue: {
            component: component,
            priority: priority,
            acceptor: acceptor,
            loader: loader
        }
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
    data.options = data.options || (() => Promise.resolve([]));
    data.type = data.type || "select";
    data.classes = !data.classes ? `form-group-${data.type}` : `${data.classes} form-group-${data.type}`;
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
