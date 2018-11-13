import {Component} from "@angular/core";
import {ObjectUtils, ReflectUtils} from "@stemy/ngx-utils";
import {
    DynamicFormControl,
    FormControlComponent,
    IDynamicForm,
    IFormControl, IFormControlOption,
    IFormControlOptions,
    IFormSelectData
} from "../../common-types";

@Component({
    moduleId: module.id,
    selector: "dynamic-form-select",
    templateUrl: "./dynamic-form-select.component.html"
})
export class DynamicFormSelectComponent extends FormControlComponent<IFormSelectData> {

    // Acceptor for provider
    static acceptor(control: IFormControl): boolean {
        return control.type == "select";
    }

    // Loader for provider
    static loader(control: DynamicFormControl, form: IDynamicForm, meta: any): Promise<any> {
        const data: IFormSelectData = control.data;
        if (data.type == "radio" && data.multi) {
            return Promise.reject("Radio group doesn't support multi select!");
        }
        return new Promise<any>(resolve => {
            const getOptions = ReflectUtils.resolve<IFormControlOptions>(data.options, form.injector);
            getOptions(control, form).then(options => {
                if (data.emptyOption) options.unshift({id: null, label: ""});
                meta["options"] = options;
                DynamicFormSelectComponent.fillOptions(control, form, options);
                resolve(options);
            });
        });
    }

    static fillOptions(control: DynamicFormControl, form: IDynamicForm, options: IFormControlOption[]): void {
        const data = control.getData<IFormSelectData>();
        const selected = control.value;
        if (data.multi || options.length == 0 || options.findIndex(t => t.id == selected) >= 0) return;
        control.setValue(options[0].id, {emitEvent: false});
    }

    onSelectChange(value: any): void {
        const isArray = ObjectUtils.isArray(value);
        const current = this.value;
        if (this.data.multi) {
            if (isArray) {
                this.handler.setValue(value);
                return;
            }
            if (ObjectUtils.isArray(current)) {
                this.handler.setValue(
                    current.indexOf(value) < 0
                        ? current.concat([value])
                        : current.filter(c => c !== value)
                );
                return;
            }
            this.handler.setValue([value]);
            return;
        }
        if (isArray) value = value[0];
        if (current == value) {
            const option = this.meta.options.find(o => o.id !== value);
            value = option ? option.id : null;
        }
        this.handler.setValue(value);
    }

    checkValue(option: IFormControlOption): boolean {
        const value = this.value;
        return ObjectUtils.isArray(value) ? value.indexOf(option.id) >= 0 : option.id == value;
    }

    findOption(option: IFormControlOption, index: number, id: string): boolean {
        return option.id == id;
    }
}
