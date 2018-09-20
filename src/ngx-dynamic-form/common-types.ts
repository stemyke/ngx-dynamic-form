import {EventEmitter, InjectionToken, Injector, Provider, Type} from "@angular/core";
import {IResolveFactory, ReflectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {isNullOrUndefined} from "util";

export const FORM_CONTROL_PROVIDER: InjectionToken<IFormControlProvider> = new InjectionToken<IFormControlProvider>("forn-control-provider");

// --- Basic form control interfaces ---
export interface IFormControlComponent {
    handler: IDynamicFormControlHandler;
}

export abstract class FormControlComponent<T extends IFormControlData> implements IFormControlComponent{

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
}

export interface IFormSelectData extends IFormControlData {
    options?: IFormControlOptions | IResolveFactory;
    emptyOption?: boolean;
    type?: string;
    multi?: boolean;
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
}

export interface IDynamicForm {
    name: string;
    controls: IFormControl[];
    fieldSets: IFormFieldSet[];
    data: any;
    readonly: boolean;
    validateOnBlur: boolean;

    onInit: EventEmitter<IDynamicForm>;
    onChange: EventEmitter<IDynamicForm>;
    onSubmit: EventEmitter<IDynamicForm>;

    id: any;
    prefix: string;
    injector: Injector;
    isLoading: boolean;
    isValid: boolean;

    validate(): Promise<any>;
    serialize(validate?: boolean): Promise<any>;
    reloadControls(): Promise<any>;
    emitChange(handler: IDynamicFormControlHandler): void;
    getControlHandler(id: string): IDynamicFormControlHandler;
    getControl(id: string): IFormControl;
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

function defaultSerializer(id: string, form: IDynamicForm): Promise<any> {
    return Promise.resolve(form.data[id]);
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
        const control = createFormControl(propertyKey, "input", data);
        data = control.data;
        data.type = data.type || inputType;
        data.placeholder = data.placeholder || (data.type == "mask" ? "_" : "");
        data.step = data.step || 1;
        data.mask = data.mask || [/\w*/gi];
        defineFormControl(target, propertyKey, control);
    };
}

export function FormSelect(data?: IFormSelectData): PropertyDecorator {
    return (target: any, propertyKey: string): void => {
        const control = createFormControl(propertyKey, "select", data);
        data = control.data;
        data.options = data.options || (() => Promise.resolve([]));
        data.type = data.type || "select";
        defineFormControl(target, propertyKey, control);
    };
}

export function FormFieldSet(data: IFormFieldSet): ClassDecorator {
    return (target: any): void => {
        const sets = getFormFieldSets(target);
        sets[data.id] = data;
        ReflectUtils.defineMetadata("dynamicFormFieldSets", sets, target);
    };
}

export function provideFormControl(component: Type<IFormControlComponent>, acceptor?: IFormControlProviderAcceptor, loader?: IFormControlProviderLoader): Provider {
    return {
        provide: FORM_CONTROL_PROVIDER,
        multi: true,
        useValue: {
            component: component,
            acceptor: acceptor || component["acceptor"],
            loader: loader || component["loader"]
        }
    };
}

export function defineFormControl(target: any, propertyKey: string, control: IFormControl) {
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
    data.label = isNullOrUndefined(data.label) ? id : data.label;
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
