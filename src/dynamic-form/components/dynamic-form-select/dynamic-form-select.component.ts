import {Component} from "@angular/core";
import {ReflectUtils} from "@stemy/ngx-utils";
import {
    FormControlComponent,
    IDynamicForm,
    IFormControl, IFormControlOption,
    IFormControlOptions,
    IFormSelectData
} from "../../dynamic-form.types";

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
    static loader(control: IFormControl, form: IDynamicForm, meta: any): Promise<any> {
        const data: IFormSelectData = control.data;
        return new Promise<any>(resolve => {
            const getOptions = ReflectUtils.resolve<IFormControlOptions>(data.options, form.injector);
            getOptions(form, data).then(options => {
                if (data.emptyOption) options.unshift({id: null, label: ""});
                meta["options"] = options;
                DynamicFormSelectComponent.fillOptions(control, form, options);
                resolve(options);
            });
        });
    }

    static fillOptions(control: IFormControl, form: IDynamicForm, options: IFormControlOption[]): void {
        const selected = form.data[control.id];
        if (options.length == 0 || options.findIndex(t => t.id == selected) >= 0) return;
        form.data[control.id] = options[0].id;
    }

    findOption(option: IFormControlOption, index: number, id: string): boolean {
        return option.id == id;
    }
}
