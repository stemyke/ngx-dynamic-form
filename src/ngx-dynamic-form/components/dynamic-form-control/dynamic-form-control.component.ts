import {Component, HostBinding, Injector, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl, FormControlTester, FormControlValidator, IDynamicForm, IDynamicFormBase,
    IDynamicFormControlHandler, IFormControlData
} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "[dynamic-form-control]",
    templateUrl: "./dynamic-form-control.component.html"
})
export class DynamicFormControlComponent implements OnInit, OnDestroy, OnChanges, IDynamicFormControlHandler {

    @Input("dynamic-form-control") control: DynamicFormControl;
    @Input() form: IDynamicForm;

    meta: any;
    errors: string[];

    get handler(): IDynamicFormControlHandler {
        return this;
    }

    get hasErrors(): boolean {
        return this.errors.length > 0;
    }

    get isValid(): boolean {
        return this.errors.length == 0;
    }

    get isReadOnly(): boolean {
        return this.readonly;
    }

    get isVisible(): boolean {
        return this.visible;
    }

    @HostBinding("class.hidden")
    get isHidden(): boolean {
        return !this.visible;
    }

    get data(): IFormControlData {
        return this.control ? this.control.data : null;
    }

    private validator: () => Promise<string[]>;
    private readonlyTester: () => Promise<boolean>;
    private hideTester: () => Promise<boolean>;

    private readonly: boolean;
    private visible: boolean;

    constructor(private injector: Injector) {
        this.meta = {};
        this.errors = [];
        this.validator = () => Promise.resolve([]);
    }

    // --- Lifecycle hooks ---

    ngOnInit(): void {
        this.form.addControlHandler(this);
    }

    ngOnDestroy(): void {
        this.form.removeControlHandler(this);
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.validator = this.createValidator();
        this.readonlyTester = this.createTester("readonly");
        this.hideTester = this.createTester("hidden");
    }

    // --- IDynamicFormControlHandler ---

    getData<T extends IFormControlData>() {
        return this.data;
    }

    setValue(value: any): void {
        this.control.setValue(value);
    }

    onFocus(): void {
        this.errors.length = 0;
    }

    onBlur(): void {
        let form: IDynamicFormBase = this.form;
        while (ObjectUtils.isDefined(form.parent)) {
            form = form.parent;
        }
        const callback = () => form.emitChange(this);
        if (form.validateOnBlur) {
            form.validate().then(callback, callback);
            return;
        }
        callback();
    }

    load(): Promise<any> {
        return this.control.provider.loader(this.control, this.form, this.meta);
    }

    check(): Promise<any> {
        return new Promise<any>(resolve => {
            this.readonlyTester().then(readonly => {
                this.readonly = readonly;
                this.hideTester().then(hide => {
                    this.visible = !hide;
                    resolve();
                });
            });
        });
    }

    validate(clearErrors?: boolean): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            this.hideTester().then(hide => {
                if (hide) {
                    resolve(true);
                    return;
                }
                this.validator().then(errors => {
                    this.errors = clearErrors ? [] : errors;
                    const validator: () => Promise<boolean> = ObjectUtils.isFunction(this.meta.validator) ? this.meta.validator : null;
                    if (!validator) {
                        resolve(errors.length == 0);
                        return;
                    }
                    validator().then(result => resolve(result && errors.length == 0));
                });
            });
        });
    }

    // --- Custom ---

    private createValidator(): () => Promise<string[]> {
        const validators = [this.data.validator].concat(this.data.validators).filter(ObjectUtils.isDefined).map(v => {
            return ReflectUtils.resolve<FormControlValidator>(v, this.injector);
        });
        return () => new Promise<string[]>((resolve) => {
            const validate = validators.map(v => v(this.control, this.form));
            Promise.all(validate).then(results => {
                resolve(results.filter(error => ObjectUtils.isString(error) && error.length > 0));
            });
        });
    }

    private createTester(test: string): () => Promise<boolean> {
        const tester: FormControlTester = this.control.data[test]
            ? ReflectUtils.resolve<FormControlTester>(this.control.data[test], this.injector)
            : () => Promise.resolve(false);
        return (): Promise<boolean> => tester(this.control, this.form);
    }
}
