import {EventEmitter, HostBinding, InjectionToken, Injector, TemplateRef, Type, ValueProvider} from "@angular/core";
import {AbstractControlOptions, FormControl} from "@angular/forms";
import {IResolveFactory, ObjectUtils, ReflectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {DynamicFormService} from "./services/dynamic-form.service";

export const FORM_CONTROL_PROVIDER: InjectionToken<IFormControlProvider> = new InjectionToken<IFormControlProvider>("form-control-provider");

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

    get control(): DynamicFormControl {
        return this.handler.control;
    }

    get value(): any {
        return !this.control ? null : this.control.value;
    }

    get meta(): any {
        return this.handler ? this.handler.meta : null;
    }

    @HostBinding("class.form-input")
    get inputClass(): boolean {
        return true;
    }
}

export type IFormControlProviderAcceptor = (control: DynamicFormControl) => boolean;
export type IFormControlProviderLoader = (control: DynamicFormControl, form: IDynamicForm, meta: any) => Promise<any>;
export type IFormControlOptions = (control: DynamicFormControl, form: IDynamicForm) => Promise<IFormControlOption[]>;
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

export class DynamicFormControl extends FormControl {

    get id(): string {
        return this.control.id;
    }

    get type(): string {
        return this.control.type;
    }

    get data(): IFormControlData {
        return this.control.data;
    }

    get topForm(): IDynamicFormBase {
        let form: IDynamicFormBase = this.form;
        while (ObjectUtils.isDefined(form.parent)) {
            form = form.parent;
        }
        return form;
    }

    public readonly provider: IFormControlProvider;

    constructor(private control: IFormControl, public readonly form: IDynamicForm) {
        super(form.data[control.id], {
            updateOn: control.data.validateOn || form.validateOn || "blur"
        });
        this.provider = form.findProvider(this);
        this.valueChanges.subscribe(value => {
            this.form.data[this.id] = value;
            this.topForm.emitChange(form.getControlHandler(this.id));
            console.log(this.id, "valueChange", value);
        });
        this.statusChanges.subscribe(status => {
            console.log(this.id, "statusChange", status);
        });
    }

    getData<T extends IFormControlData>(): T {
        return <T>this.data;
    }
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
    validateOn?: "change" | "blur" | "submit";
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
    control: DynamicFormControl;
    form: IDynamicForm;
    meta: any;
    errors: string[];
    hasErrors: boolean;
    isValid: boolean;
    isReadOnly: boolean;
    isVisible: boolean;
    isHidden: boolean;
    getData<T extends IFormControlData>();
    setValue(value: any): void;
    onFocus(): void;
    onBlur(): void
    load(): Promise<any>;
    check(): Promise<any>;
    validate(clearErrors?: boolean): Promise<boolean>;
}

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

export interface IDynamicSingleFormConfig extends IDynamicFormConfig {
    data: any;
    controls?: IFormControl[];
    fieldSets?: IFormFieldSet[];
    multi?: false;
}

export interface IDynamicMultiFormConfig extends IDynamicFormConfig {
    data: IDynamicFormsConfigs;
    multi: true;
}

export type IDynamicFormsConfigs = Array<IDynamicSingleFormConfig | IDynamicMultiFormConfig>;

export interface IDynamicFormBase {

    name: string;
    readonly: boolean;
    validateOn: "change" | "blur" | "submit";
    classes: string;
    parent: IDynamicFormBase;

    wrapperTemplate: TemplateRef<any>;
    fieldSetTemplate: TemplateRef<any>;
    controlTemplate: TemplateRef<any>;

    controlTemplates: IDynamicFormTemplates;
    labelTemplates: IDynamicFormTemplates;
    inputTemplates: IDynamicFormTemplates;
    prefixTemplates: IDynamicFormTemplates;
    suffixTemplates: IDynamicFormTemplates;

    onChange: EventEmitter<IDynamicFormControlHandler>;
    onValidate: EventEmitter<Promise<IDynamicFormBase>>;
    onInit: EventEmitter<IDynamicFormBase>;
    onSubmit: EventEmitter<IDynamicFormBase>;

    isLoading: boolean;
    isValid: boolean;
    isValidating: boolean;
    injector: Injector;

    validate(): Promise<any>;
    serialize(validate?: boolean): Promise<any>;
    emitChange(handler: IDynamicFormControlHandler): void;
    getControl(id: string): IFormControl;
    getControlHandler(id: string): IDynamicFormControlHandler;
}

export interface IDynamicForm extends IDynamicFormBase {

    controls: IFormControl[];
    fieldSets: IFormFieldSet[];
    data: any;

    id: any;
    prefix: string;

    reloadControls(): Promise<any>;
    addControlHandler(handler: IDynamicFormControlHandler);
    removeControlHandler(handler: IDynamicFormControlHandler);
    recheckControls(): Promise<any>;
    reloadControlsFrom(handler: IDynamicFormControlHandler, handlers?: Set<IDynamicFormControlHandler>): Promise<any>;
    findProvider(control: DynamicFormControl): IFormControlProvider;
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

// --- Basic form types ---
export type FormControlTester = (control: DynamicFormControl, form: IDynamicForm) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;
export type FormControlValidator = (control: DynamicFormControl, form: IDynamicForm) => Promise<string>;
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
