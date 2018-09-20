import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Injector,
    Input,
    OnChanges,
    OnDestroy,
    Output,
    QueryList,
    SimpleChanges,
    ViewChildren
} from "@angular/core";
import {Subscription} from "rxjs";
import {ITimer, ObjectUtils, TimerUtils, UniqueUtils} from "@stemy/ngx-utils";
import {getFormControl, getFormFieldSets} from "../../dynamic-form.decorators";
import {
    IDynamicForm,
    IDynamicFormControlHandler,
    IDynamicFormFieldSets,
    IFormControl,
    IFormFieldSet
} from "../../dynamic-form.types";
import {DynamicFormControlComponent} from "../dynamic-form-control/dynamic-form-control.component";

@Component({
    moduleId: module.id,
    selector: "dynamic-form",
    templateUrl: "./dynamic-form.component.html"
})
export class DynamicFormComponent implements IDynamicForm, AfterViewInit, OnChanges, OnDestroy {

    @Input() name: string;
    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;
    @Input() readonly: boolean;
    @Input() validateOnBlur: boolean;

    @Output() onInit: EventEmitter<IDynamicForm>;
    @Output() onChange: EventEmitter<IDynamicForm>;
    @Output() onSubmit: EventEmitter<IDynamicForm>;

    id: any;
    prefix: string;
    injector: Injector;
    formControls: IFormControl[];
    formFieldSets: IDynamicFormFieldSets;
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

    @ViewChildren(DynamicFormControlComponent)
    private controlComponents: QueryList<DynamicFormControlComponent>;
    private controlHandlers: {[id: string]: IDynamicFormControlHandler};
    private controlChanges: Subscription;

    private changeTimer: ITimer;
    private initialized: boolean;
    private loading: boolean;
    private valid: boolean;
    private validating: boolean;

    constructor(public cdr: ChangeDetectorRef, injector: Injector) {
        this.name = "label";

        this.onInit = new EventEmitter<IDynamicForm>();
        this.onChange = new EventEmitter<IDynamicForm>();
        this.onSubmit = new EventEmitter<IDynamicForm>();

        this.id = UniqueUtils.uuid();
        this.prefix = "label.";
        this.injector = injector;
        this.formControls = [];
        this.formFieldSets = {};
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
        this.controlHandlers = {};
        this.changeTimer = TimerUtils.createTimeout();
        this.initialized = false;
        this.loading = true;
        this.valid = false;
        this.validating = false;
    }

    // --- Lifecycle hooks

    ngAfterViewInit(): void {
        this.controlChanges = this.controlComponents.changes.subscribe(() => {
            this.controlHandlers = this.controlComponents.reduce((result, comp) => {
                result[comp.control.id] = comp;
                return result;
            }, {});
            this.reloadControls();
        });
        this.reloadControls();
    }

    ngOnDestroy(): void {
        this.controlChanges.unsubscribe();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.data || changes.controls) {
            this.formControls = this.controls || Object.keys(this.data).map(propertyKey => {
                return getFormControl(this.data, propertyKey);
            }).filter(c => !ObjectUtils.isNullOrUndefined(c));
            this.formFieldSets = this.fieldSets ? this.fieldSets.reduce((result, fs) => {
                result[fs.id] = fs;
                return result;
            }, {}) : getFormFieldSets(Object.getPrototypeOf(this.data).constructor);
        }
        this.prefix = this.name ? `${this.name}.` : "";
    }

    // --- Custom ---
    onFormSubmit(): void {
        this.validate().then(() => {
            this.valid = true;
            this.onSubmit.emit(this);
        }, () => {
            this.valid = false;
        });
    }

    // --- IDynamicForm ---

    validate(clearErrors?: boolean): Promise<any> {
        if (!this.controlComponents) return Promise.resolve();
        this.validating = true;
        return new Promise<any>((resolve, reject) => {
            const validate = Promise.all(this.controlComponents.map(t => t.validate(clearErrors)));
            validate.then(results => {
                this.validating = false;
                if (results.every(r => r)) {
                    this.valid = true;
                    return resolve();
                }
                this.valid = false;
                reject();
            });
        });
    }

    serialize(validate?: boolean): Promise<any> {
        return Promise.resolve({});
    }

    reloadControls(): Promise<any> {
        if (!this.controlComponents) return Promise.resolve();
        const load = Promise.all(this.controlComponents.map(t => t.load()));
        if (this.initialized === false) {
            this.initialized = true;
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

    emitChange(handler: IDynamicFormControlHandler): void {
        this.changeTimer.clear();
        this.changeTimer.set(() => {
            this.recheckControls().then(() => {
                this.onChange.emit(this);

            });
        }, 250);
    }

    getControl(id: string): IFormControl {
        const handler = this.controlHandlers[id];
        return !handler ? null : handler.control;
    }

    getControlHandler(id: string): IDynamicFormControlHandler {
        return this.controlHandlers[id];
    }

    private recheckControls(): Promise<any> {
        if (!this.controlComponents) return Promise.resolve();
        return Promise.all(this.controlComponents.map(t => t.check()));
    }
}
