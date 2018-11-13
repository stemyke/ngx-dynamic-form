import {AfterContentInit, ChangeDetectorRef, Component, Injector, Input, OnChanges, SimpleChanges} from "@angular/core";
import {ITimer, ObjectUtils, ReflectUtils, TimerUtils, UniqueUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl,
    getFormControl,
    getFormFieldSets,
    getFormSerializer,
    IDynamicForm,
    IDynamicFormControlHandler,
    IDynamicFormFieldSets,
    IFormControl,
    IFormControlProvider,
    IFormControlSerializer,
    IFormFieldSet,
    IFormSerializer
} from "../../common-types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {DynamicFormBaseComponent} from "../base/dynamic-form-base.component";
import {FormGroup} from "@angular/forms";

@Component({
    moduleId: module.id,
    selector: "dynamic-form, [dynamic-form]",
    templateUrl: "./dynamic-form.component.html",
    providers: [{provide: DynamicFormBaseComponent, useExisting: DynamicFormComponent}]
})
export class DynamicFormComponent extends DynamicFormBaseComponent implements IDynamicForm, AfterContentInit, OnChanges {

    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;

    id: any;
    prefix: string;

    formFieldSets: IDynamicFormFieldSets;
    formControls: DynamicFormControl[];
    formSerializers: IFormSerializer[];
    defaultFieldSet: IFormFieldSet;

    get isLoading(): boolean {
        return this.loading;
    }

    get isValid(): boolean {
        return this.valid;
    }

    get isValidating(): boolean {
        return this.validating;
    }

    private controlHandlers: IDynamicFormControlHandler[];
    private readonly controlHandlerMap: { [id: string]: IDynamicFormControlHandler };
    private readonly controlHandlerTimer: ITimer;

    private initialized: boolean;
    private loading: boolean;
    private valid: boolean;
    private validating: boolean;

    constructor(cdr: ChangeDetectorRef, injector: Injector, private forms: DynamicFormService) {
        super(cdr, injector);
        this.id = UniqueUtils.uuid();
        this.prefix = "";
        this.formControls = [];
        this.formFieldSets = {};
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
        this.controlHandlers = [];
        this.controlHandlerMap = {};
        this.controlHandlerTimer = TimerUtils.createTimeout();
        this.initialized = false;
        this.loading = false;
        this.valid = false;
        this.validating = false;
    }

    // --- Lifecycle hooks

    ngOnChanges(changes: SimpleChanges): void {
        this.prefix = this.name ? `${this.name}.` : "";
        if (ObjectUtils.isObject(this.data) && (changes.data || changes.controls)) {
            this.formFieldSets = this.fieldSets ? this.fieldSets.reduce((result, fs) => {
                result[fs.id] = fs;
                return result;
            }, {}) : getFormFieldSets(Object.getPrototypeOf(this.data).constructor);
            const props = Object.keys(this.data);
            this.formControls = (this.controls || props.map(propertyKey => {
                return getFormControl(this.data, propertyKey);
            }).filter(ObjectUtils.isDefined))
                .map(ctrl => new DynamicFormControl(ctrl, this));
            const group = new FormGroup(this.formControls.reduce((res, ctrl) => {
                res[ctrl.id] = ctrl;
                return res;
            }, {}));
            this.formSerializers = props.map(propertyKey => {
                const serializer = getFormSerializer(this.data, propertyKey);
                return !serializer ? null : {
                    id: propertyKey,
                    func: ReflectUtils.resolve<IFormControlSerializer>(serializer, this.injector)
                };
            }).filter(ObjectUtils.isDefined);
        }
    }

    // --- Custom ---

    onFormSubmit(): void {
        this.validate().then(() => this.onSubmit.emit(this), () => {});
    }

    // --- IDynamicForm ---

    validate(clearErrors?: boolean): Promise<any> {
        this.validating = true;
        const validate = new Promise<any>((resolve, reject) => {
            Promise.all(this.controlHandlers.map(h => h.validate(clearErrors))).then(results => {
                this.validating = false;
                this.valid = results.every(r => r);
                if (this.valid) {
                    resolve();
                    return;
                }
                reject();
            });
        });
        this.onValidate.emit(validate);
        return validate;
    }

    serialize(validate?: boolean): Promise<any> {
        if (!this.initialized) return Promise.resolve({});
        return new Promise<any>((resolve, reject) => {
            const serialize = () => {
                const result = {};
                const serializers = this.formSerializers.map(s => {
                    return s.func(s.id, this).then(res => {
                        const handler = this.getControlHandler(s.id);
                        if (handler && handler.isHidden) return;
                        result[s.id] = res;
                    });
                });
                Promise.all(serializers).then(() => resolve(result));
            };
            if (validate) {
                this.validate().then(serialize, reject);
                return;
            }
            serialize();
        });
    }

    emitChange(handler: IDynamicFormControlHandler): void {
        this.changeTimer.clear();
        this.changeTimer.set(() => {
            this.recheckControls().then(() => this.reloadControlsFrom(handler, new Set<IDynamicFormControlHandler>()).then(() => {
                this.onChange.emit(handler);
            }));
        }, 250);
    }

    reloadControls(): Promise<any> {
        const load = Promise.all(this.controlHandlers.map(h => h.load()));
        if (this.initialized === false) {
            this.initialized = true;
            this.loading = true;
            return new Promise<any>(resolve => {
                const callback = () => {
                    this.loading = false;
                    this.cdr.detectChanges();
                    this.onInit.emit(this);
                    resolve();
                };
                load.then(() => {
                    this.recheckControls().then(() => {
                        this.validate(true).then(callback, callback);
                    });
                });
            });
        }
        return new Promise<any>(resolve => {
            load.then(() => this.recheckControls().then(resolve));
        });
    }

    getControl(id: string): IFormControl {
        const handler = this.getControlHandler(id);
        return !handler ? null : handler.control;
    }

    getControlHandler(id: string): IDynamicFormControlHandler {
        return this.controlHandlerMap[id];
    }

    addControlHandler(handler: IDynamicFormControlHandler): void {
        this.controlHandlers.push(handler);
        this.controlHandlerMap[handler.control.id] = handler;
        this.controlHandlerTimer.set(() => this.reloadControls(), 50);
    }

    removeControlHandler(handler: IDynamicFormControlHandler): void {
        this.controlHandlers = this.controlHandlers.filter(h => h !== handler);
        delete this.controlHandlerMap[handler.control.id];
    }

    recheckControls(): Promise<any> {
        return Promise.all(this.controlHandlers.map(t => t.check()));
    }

    reloadControlsFrom(handler: IDynamicFormControlHandler, handlers?: Set<IDynamicFormControlHandler>): Promise<any> {
        const data = handler.control ? handler.control.data : null;
        if (!data || !data.reload) return Promise.resolve();
        const reload = ObjectUtils.isArray(data.reload) ? data.reload : [data.reload];
        return Promise.all(reload.map(id => {
            const handler = this.getControlHandler(id);
            if (!handler || handlers.has(handler)) return Promise.resolve();
            handlers.add(handler);
            return new Promise<any>(resolve => {
                handler.load().then(() => {
                    this.reloadControlsFrom(handler, handlers).then(resolve);
                });
            })
        }))
    }

    findProvider(control: DynamicFormControl): IFormControlProvider {
        return this.forms.findProvider(control);
    }
}
