import {InjectionToken, Injector, Input, Type} from "@angular/core";
import {IResolveFactory} from "@stemy/ngx-utils";

export const FORM_CONTROL_PROVIDER: InjectionToken<IFormControlProvider> = new InjectionToken<IFormControlProvider>("forn-control-provider");

// --- Basic form control interfaces ---
export interface IFormControlComponent {
    form: IDynamicForm;
    id: string;
    data: IFormControlData;
    meta: any;
}

export abstract class FormControlComponent<T extends IFormControlData> implements IFormControlComponent{
    form: IDynamicForm;
    id: string;
    data: T;
    meta: any;

    get value(): any {
        return this.form && this.form.data ? this.form.data[this.id] : null;
    }
}

export type IFormControlProviderAcceptor = (control: IFormControl) => boolean;
export type IFormControlProviderLoader = (control: IFormControl, form: IDynamicForm, meta: any) => Promise<any>;
export type IFormControlOptions = (form: IDynamicForm, data: IFormControlData) => Promise<IFormControlOption[]>;

export interface IFormControlProvider {
    component: Type<IFormControlComponent>;
    acceptor: IFormControlProviderAcceptor;
    loader: IFormControlProviderLoader;
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
}

export interface IFormInputData extends IFormControlData {
    type?: string;
    placeholder?: string;
    step?: number;
}

export interface IFormSelectData extends IFormControlData {
    options?: IFormControlOptions | IResolveFactory;
    emptyOption?: boolean;
    reloadOptions?: string;
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
export interface IDynamicForm {
    name: string;
    controls: IFormControl[];
    fieldSets: IFormFieldSet[];
    data: any;
    readonly: boolean;
    validateOnBlur: boolean;

    id: any;
    prefix: string;
    injector: Injector;
    isLoading: boolean;
    // getControl(id: string): IFormControl;
    // getOptionLabel(id: string): string;
    // getOptions(id: string): IFormControlOption[];
    // reloadControls(): void;
    // reloadOptions(id: string): void;
    // serialize(): Promise<any>;
    // validate(): Promise<any>;
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

export interface IDynamicFormOptions {
    [id: string]: IFormControlOption[];
}

// --- Basic form types ---
export type FormControlTester = (form: IDynamicForm, control: IFormControl) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;
export type FormControlValidator = (form: IDynamicForm, control: IFormControl) => Promise<string>;
export type FormControlValidatorFactory = FormControlValidator | IResolveFactory;
