import {AfterContentInit, ChangeDetectorRef, Component, Injector, Input, OnChanges, SimpleChanges} from "@angular/core";
import {first} from "rxjs/operators";
import {ObjectUtils, ReflectUtils, UniqueUtils} from "@stemy/ngx-utils";
import {
    defaultSerializer,
    DynamicFormControl,
    DynamicFormGroup,
    DynamicFormStatus,
    getFormControl,
    getFormFieldSets,
    getFormSerializer,
    IDynamicForm,
    IDynamicFormFieldSets,
    IFormControl,
    IFormControlProvider,
    IFormControlSerializer,
    IFormFieldSet,
    IFormSerializer, IFormSerializers
} from "../../common-types";
import {DynamicFormService} from "../../services/dynamic-form.service";
import {DynamicFormBaseComponent} from "../base/dynamic-form-base.component";

@Component({
    moduleId: module.id,
    selector: "dynamic-form, [dynamic-form]",
    templateUrl: "./dynamic-form.component.html",
    providers: [{provide: DynamicFormBaseComponent, useExisting: DynamicFormComponent}]
})
export class DynamicFormComponent extends DynamicFormBaseComponent implements IDynamicForm, AfterContentInit, OnChanges {

    @Input() formGroup: DynamicFormGroup;
    @Input() serializers: IFormSerializers;
    @Input() controls: IFormControl[];
    @Input() fieldSets: IFormFieldSet[];
    @Input() data: any;

    id: any;
    prefix: string;

    formFieldSets: IDynamicFormFieldSets;
    formSerializers: IFormSerializer[];
    defaultFieldSet: IFormFieldSet;

    get status(): DynamicFormStatus {
        return <DynamicFormStatus>(this.loading ? "LOADING" : this.formGroup.status);
    }

    get formControls(): DynamicFormControl[] {
        return this.formGroup.controlArray;
    }

    private initialized: boolean;
    private loading: boolean;

    constructor(cdr: ChangeDetectorRef, injector: Injector, private forms: DynamicFormService) {
        super(cdr, injector);
        this.id = UniqueUtils.uuid();
        this.prefix = "";
        this.formGroup = new DynamicFormGroup([]);
        this.formFieldSets = {};
        this.defaultFieldSet = {
            id: "",
            title: "",
            classes: ""
        };
        this.initialized = false;
        this.loading = false;
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
            this.formGroup = new DynamicFormGroup((this.controls || props.map(propertyKey => {
                return getFormControl(this.data, propertyKey);
            }).filter(ObjectUtils.isDefined))
                .map(ctrl => new DynamicFormControl(ctrl, this)), this);
            this.formGroup.statusChanges.subscribe(() => {
                const topForm = this.formGroup.topForm;
                topForm.onStatusChange.emit(topForm);
            });
            this.formSerializers = ObjectUtils.isObject(this.serializers) ? Object.keys(this.serializers).map(id => {
                const serializer = this.serializers[id] || defaultSerializer;
                return !serializer ? null : {
                    id: id,
                    func: ReflectUtils.resolve<IFormControlSerializer>(serializer, this.injector)
                };
            }) : props.map(id => {
                const serializer = getFormSerializer(this.data, id);
                return !serializer ? null : {
                    id: id,
                    func: ReflectUtils.resolve<IFormControlSerializer>(serializer, this.injector)
                };
            }).filter(ObjectUtils.isDefined);
            this.reloadControls();
        }
    }

    // --- Custom ---

    onFormSubmit(): void {
        const topForm = this.formGroup.topForm;
        topForm.validate().then(() => topForm.onSubmit.emit(this), () => {});
    }

    // --- IDynamicForm ---

    validate(showErrors: boolean = true): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.formGroup.statusChanges.pipe(first(status => status == "VALID" || status == "INVALID")).subscribe(status => {
                if (showErrors) this.showErrors();
                if (status == "VALID") {
                    resolve(null);
                    return;
                }
                reject(null);
            });
            this.formGroup.updateValueAndValidity();
        });
    }

    serialize(validate?: boolean): Promise<any> {
        if (!this.initialized) return Promise.resolve({});
        return new Promise<any>((resolve, reject) => {
            const serialize = () => {
                const result = {};
                const serializers = this.formSerializers.map(s => {
                    return s.func(s.id, this).then(res => {
                        const handler = this.getControl(s.id);
                        if (handler && !handler.visible) return;
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

    emitChange(control: DynamicFormControl): void {
        this.changeTimer.clear();
        this.changeTimer.set(() => {
            this.recheckControls().then(() => this.reloadControlsFrom(control, new Set<DynamicFormControl>()).then(() => {
                const topForm = this.formGroup.topForm;
                topForm.onChange.emit(control);
            }));
        }, 250);
    }

    reloadControls(): void {
        const load = Promise.all(this.formControls.map(h => h.load()));
        let callback = () => {};
        if (this.initialized === false) {
            this.initialized = true;
            this.loading = true;
            callback = () => {
                this.loading = false;
                this.cdr.detectChanges();
                const topForm = this.formGroup.topForm;
                topForm.onInit.emit(topForm);
                topForm.onStatusChange.emit(topForm);
            };
        }
        load.then(() => this.recheckControls().then(callback, callback));
    }

    getControl(id: string): DynamicFormControl {
        return <DynamicFormControl>this.formGroup.get(id);
    }

    recheckControls(): Promise<any> {
        return Promise.all(this.formControls.map(h => h.check()));
    }

    reloadControlsFrom(control: DynamicFormControl, controls?: Set<DynamicFormControl>): Promise<any> {
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

    findProvider(control: DynamicFormControl): IFormControlProvider {
        return this.forms.findProvider(control);
    }

    showErrors(): void {
        this.formControls.forEach(control => control.showErrors());
    }
}
