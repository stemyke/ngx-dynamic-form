import {EventEmitter, HostBinding, InjectionToken, Injector, TemplateRef, Type, ValueProvider} from "@angular/core";
import {AbstractControl, FormControl, FormGroup, ValidationErrors} from "@angular/forms";
import {IResolveFactory, ITimer, ObjectUtils, ReflectUtils, TimerUtils, UniqueUtils} from "@stemy/ngx-utils";

export const FORM_CONTROL_PROVIDER: InjectionToken<IFormControlProvider> = new InjectionToken<IFormControlProvider>("form-control-provider");

// --- Basic form control interfaces ---
export interface IFormControlComponent {
    control: IDynamicFormControl;
}

export abstract class FormControlComponent<T extends IFormControlData> implements IFormControlComponent {

    control: IDynamicFormControl;

    get form(): IDynamicFormBase {
        return !this.control ? null: this.control.form;
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

export type IFormControlProviderAcceptor = (control: IDynamicFormControl) => boolean;
export type IFormControlProviderLoader = (control: IDynamicFormControl) => Promise<any>;
export type IFormControlOptions = (control: IDynamicFormControl) => Promise<IFormControlOption[]>;
export type IFormControlSerializer = (id: string, parent: IDynamicFormControl) => Promise<any>;
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

export interface IFormSerializers {
    [id: string]: IFormControlSerializer | IResolveFactory | null
}

export type DynamicFormState = "VALID" | "INVALID" | "PENDING" | "DISABLED" | "LOADING";
export type DynamicFormUpdateOn = "change" | "blur" | "submit";

export interface IDynamicFormControl {
    id: string;
    type: string;
    data: IFormControlData;
    visible: boolean;
    meta: any;
    form: IDynamicFormBase;
    injector: Injector;
    label: string;
    provider: IFormControlProvider;
    model: any;
    formId: string;

    errors: ValidationErrors;
    value: any;
    disabled: boolean;
    updateOn: DynamicFormUpdateOn;

    setValue(value: any): void;

    getData<T extends IFormControlData>(): T;
    getControl(id: string): IDynamicFormControl;
    load(): Promise<any>;
    check(): Promise<any>;
    shouldSerialize(): Promise<boolean>;
    serialize(): Promise<any>;
    onFocus(): void;
    onBlur(): void;
    showErrors(): void;
}

function createValidator(control: IDynamicFormControl): (control: AbstractControl) => Promise<ValidationErrors> {
    const data = control.data || {};
    const validators = [data.validator].concat(data.validators || []).filter(ObjectUtils.isDefined).map(v => {
        return ReflectUtils.resolve<FormControlValidator>(v, control.injector);
    });
    return (ctrl: any) => new Promise<ValidationErrors>((resolve) => {
        const control = <IDynamicFormControl>ctrl;
        // control.hideTester()
        Promise.resolve(false).then(hide => {
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

class DynamicFormControlHelper {

    get id(): string {
        return !this.control ? null : this.control.id;
    }

    get type(): string {
        return !this.control ? "" : this.control.type;
    }

    get data(): IFormControlData {
        return !this.control ? this.dummyData : this.control.data || this.dummyData;
    }

    get visible(): boolean {
        return !this.hidden;
    }

    get provider(): IFormControlProvider {
        return this.ctrlProvider;
    }

    public readonly formId: string;
    public readonly meta: any;

    private hidden: boolean;
    private ctrlProvider: IFormControlProvider;
    private readonly dummyData: IFormControlData;
    private readonly readonlyTester: (control: IDynamicFormControl) => Promise<boolean>;
    private readonly hideTester: (control: IDynamicFormControl) => Promise<boolean>;
    private readonly serializeTester: (control: IDynamicFormControl) => Promise<boolean>;

    constructor(private form: IDynamicFormBase, private control: IFormControl = null) {
        this.formId = UniqueUtils.uuid();
        this.meta = {};
        this.hidden = false;
        this.dummyData = {};
        this.readonlyTester = this.createTester("readonly");
        this.hideTester = this.createTester("hidden");
        this.serializeTester = this.createTester("shouldSerialize", (control: IDynamicFormControl) => {
            return Promise.resolve(control.visible);
        });
    }

    load(control: IDynamicFormControl): Promise<any> {
        return !this.ctrlProvider ? Promise.resolve() : this.ctrlProvider.loader(control);
    }

    check(control: IDynamicFormControl): Promise<boolean> {
        return new Promise<any>(resolve => {
            this.hideTester(control).then(hide => {
                this.hidden = hide;
                this.readonlyTester(control).then(readonly => {
                    resolve(control.form.readonly || readonly);
                });
            });
        });
    }

    shouldSerialize(control: IDynamicFormControl): Promise<boolean> {
        return this.serializeTester(control);
    }

    findProvider(control: IDynamicFormControl): void {
        this.ctrlProvider = !this.control || !this.control.type ? null : this.form.findProvider(control);
    }

    private createTester(test: string, defaultFunc: FormControlTester = null): (control: IDynamicFormControl) => Promise<boolean> {
        const tester: FormControlTester = this.data[test]
            ? ReflectUtils.resolve<FormControlTester>(this.data[test], this.form.injector)
            : (defaultFunc || (() => Promise.resolve(false)));
        return (control: IDynamicFormControl): Promise<boolean> => tester(control);
    }
}

export class DynamicFormGroup extends FormGroup implements IDynamicFormControl {

    get id(): string {
        return this.helper.id;
    }

    get type(): string {
        return this.helper.type;
    }

    get data(): IFormControlData {
        return this.helper.data;
    }

    get visible(): boolean {
        return this.helper.visible;
    }

    get meta(): any {
        return this.helper.meta;
    }

    get injector(): Injector {
        return this.form.injector;
    }

    get label(): string {
        return this.data.label !== "" ? `${this.prefix}${this.data.label}` : "";
    }

    get provider(): IFormControlProvider {
        return this.helper.provider;
    }

    get model(): any {
        return this.mModel;
    }

    get formId(): string {
        return this.helper.formId;
    }

    get formControls(): IDynamicFormControl[] {
        return this.mControls || [];
    }

    get formFields(): IDynamicFormFieldSets {
        return this.mFieldSets || {};
    }

    get prefix(): string {
        return !this.name ? "" : `${this.name}.`;
    }

    get name(): string {
        return this.mName;
    }

    get state(): DynamicFormState {
        return <DynamicFormState>(this.loading ? "LOADING" : this.status);
    }

    private helper: DynamicFormControlHelper;
    private mName: string;
    private mModel: any;
    private mControls: IDynamicFormControl[];
    private mSerializers: IFormSerializer[];
    private mFieldSets: IDynamicFormFieldSets;
    private initialized: boolean;
    private loading: boolean;
    private changeTimer: ITimer;

    private static createFormControls(group: DynamicFormGroup, controls: IFormControl[]): IDynamicFormControl[] {
        if (!controls && ObjectUtils.isObject(group.model)) {
            const props = Object.keys(group.model);
            controls = props.map(id => {
                return getFormControl(group.model, id);
            }).filter(ObjectUtils.isDefined);
        }
        if (!controls) return [];
        return controls.map(ctrl => {
            if (ctrl.type == "model") {
                const subGroup = new DynamicFormGroup(group.form, ctrl);
                const model = group.model[ctrl.id] || {};
                const data = subGroup.getData<IFormModelData>();
                data.name = data.name || group.name;
                subGroup.setup(model, data);
                group.model[ctrl.id] = model;
                group.addControl(subGroup.id, subGroup);
                return subGroup;
            }
            return new DynamicFormControl(ctrl, group);
        });
    }

    private static createFormSerializers(group: DynamicFormGroup, serializers: IFormSerializers): IFormSerializer[] {
        if (!serializers && ObjectUtils.isObject(group.model)) {
            const props = Object.keys(group.model);
            serializers = props.reduce((result, id) => {
                const serializer = getFormSerializer(group.model, id);
                if (!serializer) return result;
                result[id] = serializer;
                return result;
            }, {});
        }
        if (!serializers) return [];
        return Object.keys(serializers).map(id => {
            const serializer = serializers[id] || defaultSerializer;
            return !serializer ? null : {
                id: id,
                func: ReflectUtils.resolve<IFormControlSerializer>(serializer, group.injector)
            };
        });
    }

    constructor(public readonly form: IDynamicFormBase, control: IFormControl = null) {
        super({}, {updateOn: ((!control || !control.data) ? null : control.data.updateOn) || form.updateOn || "blur"});
        this.mName = "";
        this.mModel = {};
        this.mControls = [];
        this.mSerializers = [];
        this.mFieldSets = {};
        this.helper = new DynamicFormControlHelper(form, control);
        this.helper.findProvider(this);
        this.initialized = false;
        this.loading = false;
        this.changeTimer = TimerUtils.createTimeout();
        this.statusChanges.subscribe(() => {
            const root = this.form.root;
            root.onStatusChange.emit(root);
        });
        this.setAsyncValidators(createValidator(this));
    }

    getData<T extends IFormControlData>(): T {
        return <T>this.data;
    }

    getControl(id: string): IDynamicFormControl {
        return <any>this.get(id);
    }

    load(): Promise<any> {
        const promises = this.mControls.map(c => c.load());
        promises.push(this.helper.load(this));
        return Promise.all(promises);
    }

    check(): Promise<any> {
        const check = this.helper.check(this);
        const promises = this.mControls.map(c => c.check());
        promises.push(check);
        check.then(readonly => {
            if (readonly) this.disable({emitEvent: false}); else this.enable({emitEvent: false});
        });
        return Promise.all(promises);
    }

    shouldSerialize(): Promise<boolean> {
        return this.helper.shouldSerialize(this);
    }

    serialize(): Promise<any> {
        return new Promise<any>((resolve) => {
            const result = {};
            const serializers = this.mSerializers.map(s => {
                return new Promise<any>(resolve => {
                    s.func(s.id, this).then(res => {
                        const ctrl = this.getControl(s.id);
                        const promise = !ctrl ? Promise.resolve(true) : ctrl.shouldSerialize();
                        promise.then(should => {
                            if (should) result[s.id] = res;
                            resolve();
                        });
                    });
                });
            });
            Promise.all(serializers).then(() => resolve(result));
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
        this.mControls.forEach(ctrl => ctrl.showErrors());
    }

    reloadControls(): Promise<any> {
        let callback = () => {};
        if (this.initialized === false) {
            this.initialized = true;
            this.loading = true;
            callback = () => {
                this.loading = false;
                // this.cdr.detectChanges();
                const root = this.form.root;
                root.onInit.emit(root);
                root.onStatusChange.emit(root);
                // https://github.com/angular/angular/issues/14542
                const statusTimer = TimerUtils.createInterval();
                statusTimer.set(() => {
                    if (this.status == "PENDING") return;
                    statusTimer.clear();
                    root.onStatusChange.emit(root);
                }, 50);
                setTimeout(statusTimer.clear, 5000);
            };
        }
        const promise = new Promise<any>(resolve => {
            this.load().then(() => this.check().then(resolve));
        });
        promise.then(callback, callback);
        return promise;
    }

    setup(model: any, info: IDynamicFormInfo): void {
        this.mName = info.name || "";
        this.mModel = model;
        this.mControls.forEach(ctrl => this.removeControl(ctrl.id));
        this.mControls = DynamicFormGroup.createFormControls(this, info.controls);
        this.mControls.forEach((ctrl: any) => this.addControl(ctrl.id, ctrl));
        this.mSerializers = DynamicFormGroup.createFormSerializers(this, info.serializers);
        this.mFieldSets = info.fieldSets ? info.fieldSets.reduce((result, fs) => {
            result[fs.id] = fs;
            return result;
        }, {}) : getFormFieldSets(Object.getPrototypeOf(model).constructor);
    }

    updateModel(control: IDynamicFormControl): void {
        this.model[control.id] = control.value;
        this.changeTimer.clear();
        this.changeTimer.set(() => {
            this.check().then(() => this.reloadControlsFrom(control, new Set<IDynamicFormControl>()).then(() => {
                this.form.root.onChange.emit(control);
            }));
        }, 250);
    }

    private reloadControlsFrom(control: IDynamicFormControl, controls?: Set<IDynamicFormControl>): Promise<any> {
        const data = control.data;
        if (!data || !data.reload) return Promise.resolve();
        const reload = ObjectUtils.isArray(data.reload) ? data.reload : [data.reload];
        return Promise.all(reload.map(id => {
            const nextControl = this.getControl(id);
            if (!nextControl || controls.has(nextControl)) return Promise.resolve();
            controls.add(nextControl);
            return new Promise<any>(resolve => {
                nextControl.load().then(() => {
                    this.reloadControlsFrom(nextControl, controls).then(resolve);
                });
            })
        }))
    }
}

export class DynamicFormControl extends FormControl implements IDynamicFormControl {

    get id(): string {
        return this.helper.id;
    }

    get type(): string {
        return this.helper.type;
    }

    get data(): IFormControlData {
        return this.helper.data;
    }

    get visible(): boolean {
        return this.helper.visible;
    }

    get meta(): any {
        return this.helper.meta;
    }

    get form(): IDynamicFormBase {
        return this.group.form;
    }

    get injector(): Injector {
        return this.form.injector;
    }

    get label(): string {
        return this.data.label !== "" ? `${this.group.prefix}${this.data.label}` : "";
    }

    get provider(): IFormControlProvider {
        return this.helper.provider;
    }

    get model(): any {
        return this.group.model;
    }

    get formId(): string {
        return this.helper.formId;
    }

    private helper: DynamicFormControlHelper;

    constructor(private control: IFormControl, public readonly group: DynamicFormGroup) {
        super(group.model[control.id], {updateOn: control.data.updateOn || group.updateOn});
        this.group.addControl(control.id, this);
        this.helper = new DynamicFormControlHelper(this.form, control);
        this.helper.findProvider(this);
        this.valueChanges.subscribe(() => this.group.updateModel(this));
        this.setAsyncValidators(createValidator(this));
    }

    getData<T extends IFormControlData>(): T {
        return <T>this.data;
    }

    getControl(id: string): IDynamicFormControl {
        return null;
    }

    load(): Promise<any> {
        return this.helper.load(this);
    }

    check(): Promise<any> {
        const check = this.helper.check(this);
        check.then(readonly => {
            if (readonly) this.disable({emitEvent: false}); else this.enable({emitEvent: false});
        });
        return check;
    }

    shouldSerialize(): Promise<boolean> {
        return this.helper.shouldSerialize(this);
    }

    serialize(): Promise<any> {
        return Promise.resolve(this.value);
    }

    onFocus(): void {
        this.markAsUntouched({onlySelf: true});
    }

    onBlur(): void {
        this.markAsTouched({onlySelf: true});
    }

    showErrors(): void {
        this.markAsTouched({onlySelf: true});
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
    shouldSerialize?: FormControlTesterFactory;
    validator?: FormControlValidatorFactory;
    validators?: FormControlValidatorFactory[];
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
    options?: IFormControlOptions | IResolveFactory;
    emptyOption?: boolean;
    type?: string;
    multi?: boolean;
}

export interface IFormStaticData extends IFormControlData {
    properties?: string[];
    style?: string;
}

export interface IFormModelData extends IFormControlData, IDynamicFormInfo {

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

export interface IDynamicSingleFormConfig extends IDynamicFormConfig, IDynamicFormInfo {
    data: any;
    multi?: false;
}

export interface IDynamicMultiFormConfig extends IDynamicFormConfig {
    data: IDynamicFormsConfigs;
    multi: true;
}

export type IDynamicFormsConfigs = Array<IDynamicSingleFormConfig | IDynamicMultiFormConfig>;

export interface IDynamicFormBase {

    name?: string;
    readonly?: boolean;
    updateOn?: "change" | "blur" | "submit";
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

    onChange: EventEmitter<IDynamicFormControl>;
    onStatusChange: EventEmitter<IDynamicFormBase>;
    onInit: EventEmitter<IDynamicFormBase>;
    onSubmit: EventEmitter<IDynamicFormBase>;

    root?: IDynamicFormBase;
    status: DynamicFormState;
    injector?: Injector;

    validate(showErrors?: boolean): Promise<any>;

    serialize(validate?: boolean): Promise<any>;

    getControl(id: string): IDynamicFormControl;

    findProvider(control: IDynamicFormControl): IFormControlProvider;
}

export interface IDynamicFormInfo {
    group?: DynamicFormGroup;
    name?: string;
    controls?: IFormControl[];
    serializers?: IFormSerializers;
    fieldSets?: IFormFieldSet[];
}

export interface IDynamicForm extends IDynamicFormBase, IDynamicFormInfo {
    data: any;
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

// --- Basic form types ---
export type FormControlTester = (control: IDynamicFormControl) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;
export type FormControlValidator = (control: IDynamicFormControl) => Promise<string | ValidationErrors>;
export type FormControlValidatorFactory = FormControlValidator | IResolveFactory;

// --- Decorator functions ---
const emptyArray: any = [];
const emptyTester: FormControlTester = () => {
    return Promise.resolve(false);
};

export function defaultSerializer(id: string, parent: IDynamicFormControl): Promise<any> {
    const control = parent.getControl(id);
    return !control ? Promise.resolve(parent.model[id]) : control.serialize();
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
