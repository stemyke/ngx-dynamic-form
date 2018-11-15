import {EventEmitter, HostBinding, InjectionToken, Injector, TemplateRef, Type, ValueProvider} from "@angular/core";
import {AbstractControl, FormControl, FormGroup, ValidationErrors} from "@angular/forms";
import {IResolveFactory, ObjectUtils, ReflectUtils, TimerUtils, UniqueUtils} from "@stemy/ngx-utils";

export const FORM_CONTROL_PROVIDER: InjectionToken<IFormControlProvider> = new InjectionToken<IFormControlProvider>("form-control-provider");

// --- Basic form control interfaces ---
export interface IFormControlComponent {
    control: DynamicFormControl;
}

export abstract class FormControlComponent<T extends IFormControlData> implements IFormControlComponent {

    control: DynamicFormControl;

    get form(): IDynamicForm {
        return !this.control ? null : this.control.form;
    }

    get data(): T {
        return <T>(!this.control ? {} : this.control.data);
    }

    get value(): any {
        return !this.control ? null : this.control.value;
    }

    get meta(): any {
        return !this.control ? null : this.control.meta;
    }

    @HostBinding("class.form-input")
    get inputClass(): boolean {
        return true;
    }
}

export type IFormControlProviderAcceptor = (control: DynamicFormControl) => boolean;
export type IFormControlProviderLoader = (control: DynamicFormControl) => Promise<any>;
export type IFormControlOptions = (control: DynamicFormControl) => Promise<IFormControlOption[]>;
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

export type DynamicFormStatus = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormValidateOn = "change" | "blur" | "submit";

export interface IDynamicFormControl {
    id: string;
    type: string;
    data: IFormControlData;
    visible: boolean;
    topForm: IDynamicFormBase;
    meta: any;

    getData<T extends IFormControlData>();
    load(): Promise<any>;
    check(): Promise<any>;
    onFocus(): void;
    onBlur(): void;
    showErrors(): void;
}

export class DynamicFormGroup extends FormGroup {

    get topForm(): IDynamicFormBase {
        let form: IDynamicFormBase = this.form;
        while (ObjectUtils.isDefined(form.parent)) {
            form = form.parent;
        }
        return form;
    }

    constructor(public readonly controlArray: DynamicFormControl[], public readonly form?: IDynamicForm) {
        super(controlArray.reduce((group, control) => {
            group[control.id] = control;
            return group;
        }, {}));
        if (!this.form) return;
        // https://github.com/angular/angular/issues/14542
        const statusTimer = TimerUtils.createInterval();
        statusTimer.set(() => {
            if (this.status == "PENDING") return;
            statusTimer.clear();
            (this.statusChanges as EventEmitter<string>).emit(this.status);
        }, 50);
        setTimeout(statusTimer.clear, 5000);
    }
}

export class DynamicFormControl extends FormControl implements IDynamicFormControl {

    get id(): string {
        return this.control.id;
    }

    get type(): string {
        return this.control.type;
    }

    get data(): IFormControlData {
        return this.control.data;
    }

    get visible(): boolean {
        return !this.hidden;
    }

    get topForm(): IDynamicFormBase {
        let form: IDynamicFormBase = this.form;
        while (ObjectUtils.isDefined(form.parent)) {
            form = form.parent;
        }
        return form;
    }

    public readonly provider: IFormControlProvider;
    public readonly meta: any;
    public readonly readonlyTester: () => Promise<boolean>;
    public readonly hideTester: () => Promise<boolean>;

    private hidden: boolean;

    private static createValidator(control: DynamicFormControl): (control: AbstractControl) => Promise<ValidationErrors> {
        const data = control.data;
        const validators = [data.validator].concat(data.validators).filter(ObjectUtils.isDefined).map(v => {
            return ReflectUtils.resolve<FormControlValidator>(v, control.form.injector);
        });
        return (control: DynamicFormControl) => new Promise<ValidationErrors>((resolve) => {
            control.hideTester().then(hide => {
                if (hide) {
                    resolve(null);
                    return;
                }
                const validate = validators.map(v => v(control));
                const metaValidator = control.meta.validator;
                if (ObjectUtils.isFunction(metaValidator)) {
                    validate.push(metaValidator(control));
                }
                Promise.all(validate).then(results => {
                    results = results.filter(error => ObjectUtils.isObject(error) || ObjectUtils.isString(error));
                    let result: ValidationErrors = null;
                    if (results.length > 0) {
                        result = {};
                        results.forEach(error => {
                            if (ObjectUtils.isString(error)) {
                                result[error] = {};
                                return;
                            }
                            result = Object.assign(result, error);
                        });
                    }
                    resolve(result);
                });
            });
        });
    }

    private static createTester(control: DynamicFormControl, test: string): () => Promise<boolean> {
        const tester: FormControlTester = control.data[test]
            ? ReflectUtils.resolve<FormControlTester>(control.data[test], control.form.injector)
            : () => Promise.resolve(false);
        return (): Promise<boolean> => tester(control);
    }

    constructor(private control: IFormControl, public readonly form: IDynamicForm) {
        super(form.data[control.id], {updateOn: control.data.validateOn || form.validateOn || "blur"});
        this.provider = form.findProvider(this);
        this.meta = {
            showErrors: () => {}
        };
        this.hidden = false;
        this.readonlyTester = DynamicFormControl.createTester(this, "readonly");
        this.hideTester = DynamicFormControl.createTester(this, "hidden");
        this.valueChanges.subscribe(value => {
            this.form.data[this.id] = value;
            this.topForm.emitChange(this);
        });
        this.setAsyncValidators(DynamicFormControl.createValidator(this));
    }

    getData<T extends IFormControlData>(): T {
        return <T>this.data;
    }

    load(): Promise<any> {
        return this.provider.loader(this);
    }

    check(): Promise<any> {
        return new Promise<any>(resolve => {
            this.readonlyTester().then(readonly => {
                if (readonly) this.disable({emitEvent: false}); else this.enable({emitEvent: false});
                this.hideTester().then(hide => {
                    this.hidden = hide;
                    resolve();
                });
            });
        });
    }

    onFocus(): void {
        this.markAsUntouched({onlySelf: true});
    }

    onBlur(): void {
        this.markAsTouched({onlySelf: true});
    }

    showErrors(): void {
        this.markAsTouched({onlySelf: true});
        this.meta.showErrors();
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
    validateOn?: DynamicFormValidateOn;
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

    onChange: EventEmitter<DynamicFormControl>;
    onStatusChange: EventEmitter<IDynamicFormBase>;
    onInit: EventEmitter<IDynamicFormBase>;
    onSubmit: EventEmitter<IDynamicFormBase>;

    status: DynamicFormStatus;
    injector: Injector;

    validate(showErrors?: boolean): Promise<any>;
    serialize(validate?: boolean): Promise<any>;
    emitChange(handler: DynamicFormControl): void;
    getControl(id: string): DynamicFormControl;
}

export interface IDynamicForm extends IDynamicFormBase {

    formGroup: DynamicFormGroup;
    controls: IFormControl[];
    fieldSets: IFormFieldSet[];
    data: any;

    id: any;
    prefix: string;

    reloadControls(): Promise<any>;
    recheckControls(): Promise<any>;
    reloadControlsFrom(control: DynamicFormControl, controls?: Set<DynamicFormControl>): Promise<any>;
    findProvider(control: DynamicFormControl): IFormControlProvider;
    showErrors(): void;
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

// --- Basic form types ---
export type FormControlTester = (control: DynamicFormControl) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;
export type FormControlValidator = (control: DynamicFormControl) => Promise<string | ValidationErrors>;
export type FormControlValidatorFactory = FormControlValidator | IResolveFactory;

// --- Decorator functions ---
const emptyArray: any = [];
const emptyTester: FormControlTester = () => {
    return Promise.resolve(false);
};

export function defaultSerializer(id: string, form: IDynamicForm): Promise<any> {
    const control = form.getControl(id);
    if (!control || !ObjectUtils.isFunction(control.meta.serializer)) return Promise.resolve(form.data[id]);
    return control.meta.serializer();
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
