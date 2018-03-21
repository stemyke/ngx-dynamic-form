import {IResolveFactory} from "@stemy/ngx-utils";

// --- Basic form control interfaces ---
export interface IFormControlOption {
    id?: any;
    label: string;
}

export interface IDynamicFormOptions {
    [id: string]: IFormControlOption[];
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

export interface IFormFieldSet {
    id: string;
    title?: string;
    classes?: string;
}

// --- Basic form interfaces ---
export interface IDynamicForm {
    data: any;
    getControl(id: string): IFormControl;
    getOptionLabel(id: string): string;
    getOptions(id: string): IFormControlOption[];
    reloadControls(): void;
    reloadOptions(id: string): void;
    serialize(): Promise<any>;
    validate(): Promise<any>;
}

export interface IDynamicFormFieldSets {
    [id: string]: IFormFieldSet
}

// --- Basic form types ---
export type FormControlTester = (form: IDynamicForm, control: IFormControl) => Promise<boolean>;
export type FormControlTesterFactory = FormControlTester | IResolveFactory;
export type FormControlValidator = (form: IDynamicForm, control: IFormControl) => Promise<string>;
export type FormControlValidatorFactory = FormControlValidator | IResolveFactory;
