import {
    AfterContentInit,
    ChangeDetectorRef,
    Component,
    ContentChild,
    ContentChildren,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    Output,
    QueryList,
    SimpleChanges,
    TemplateRef
} from "@angular/core";
import {ITimer, ObjectUtils, ReflectUtils, TimerUtils, UniqueUtils} from "@stemy/ngx-utils";
import {
    getFormControl,
    getFormFieldSets,
    getFormSerializer,
    IDynamicForm, IDynamicFormBase,
    IDynamicFormControlHandler,
    IDynamicFormFieldSets,
    IDynamicFormTemplates,
    IFormControl,
    IFormControlSerializer,
    IFormFieldSet,
    IFormSerializer
} from "../../common-types";
import {DynamicFormTemplateDirective} from "../../directives/dynamic-form-template.directive";

@Component({
    moduleId: module.id,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html"
})
export class DynamicFormComponent implements IDynamicForm, AfterContentInit, OnChanges {

    @Input() name: string;
    @Input() readonly: boolean;
    @Input() validateOnBlur: boolean;
    @Input() parent: IDynamicFormBase;

    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;

    @Input() wrapperTemplate: TemplateRef<any>;
    @Input() fieldSetTemplate: TemplateRef<any>;
    @Input() controlTemplate: TemplateRef<any>;

    @Input() controlTemplates: IDynamicFormTemplates;
    @Input() labelTemplates: IDynamicFormTemplates;
    @Input() inputTemplates: IDynamicFormTemplates;
    @Input() prefixTemplates: IDynamicFormTemplates;
    @Input() suffixTemplates: IDynamicFormTemplates;

    @Output() onChange: EventEmitter<IDynamicFormControlHandler>;
    @Output() onValidate: EventEmitter<Promise<IDynamicForm>>;
    @Output() onInit: EventEmitter<IDynamicForm>;
    @Output() onSubmit: EventEmitter<IDynamicForm>;

    id: any;
    prefix: string;
    injector: Injector;

    formFieldSets: IDynamicFormFieldSets;
    formControls: IFormControl[];
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

    @ContentChildren(DynamicFormTemplateDirective)
    private templates: QueryList<DynamicFormTemplateDirective>;


    @ContentChild("wrapperTemplate")
    cWrapperTemplate: TemplateRef<any>;

    @ContentChild("fieldSetTemplate")
    cFieldSetTemplate: TemplateRef<any>;

    @ContentChild("controlTemplate")
    cControlTemplate: TemplateRef<any>;

    private controlHandlers: IDynamicFormControlHandler[];
    private readonly controlHandlerMap: { [id: string]: IDynamicFormControlHandler };
    private readonly controlHandlerTimer: ITimer;

    private changeTimer: ITimer;
    private initialized: boolean;
    private loading: boolean;
    private valid: boolean;
    private validating: boolean;

    constructor(public cdr: ChangeDetectorRef, injector: Injector) {
        this.name = "";

        this.onChange = new EventEmitter<IDynamicFormControlHandler>();
        this.onValidate = new EventEmitter<Promise<IDynamicForm>>();
        this.onInit = new EventEmitter<IDynamicForm>();
        this.onSubmit = new EventEmitter<IDynamicForm>();

        this.controlTemplates = {};
        this.labelTemplates = {};
        this.inputTemplates = {};
        this.prefixTemplates = {};
        this.suffixTemplates = {};

        this.id = UniqueUtils.uuid();
        this.prefix = "";
        this.injector = injector;
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
        this.changeTimer = TimerUtils.createTimeout();
        this.initialized = false;
        this.loading = false;
        this.valid = false;
        this.validating = false;
    }

    // --- Lifecycle hooks

    ngAfterContentInit(): void {
        this.wrapperTemplate = this.wrapperTemplate || this.cWrapperTemplate;
        this.fieldSetTemplate = this.fieldSetTemplate || this.cFieldSetTemplate;
        this.controlTemplate = this.controlTemplate || this.cControlTemplate;
        this.controlTemplates = this.controlTemplates || this.filterTemplates("control");
        this.labelTemplates = this.labelTemplates || this.filterTemplates("label");
        this.inputTemplates = this.inputTemplates || this.filterTemplates("input");
        this.prefixTemplates = this.prefixTemplates || this.filterTemplates("prefix");
        this.suffixTemplates = this.suffixTemplates || this.filterTemplates("suffix");
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.prefix = this.name ? `${this.name}.` : "";
        if (ObjectUtils.isObject(this.data) && (changes.data || changes.controls)) {
            this.formFieldSets = this.fieldSets ? this.fieldSets.reduce((result, fs) => {
                result[fs.id] = fs;
                return result;
            }, {}) : getFormFieldSets(Object.getPrototypeOf(this.data).constructor);
            const props = Object.keys(this.data);
            this.formControls = this.controls || props.map(propertyKey => {
                return getFormControl(this.data, propertyKey);
            }).filter(ObjectUtils.isDefined);
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
                return Promise.all(serializers).then(() => resolve(result));
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

    private filterTemplates(type: string): IDynamicFormTemplates {
        return this.templates.filter(t => !!t[type]).reduce((result, directive) => {
            result[directive[type]] = directive.template;
            return result;
        }, {});
    }
}
