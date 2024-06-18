import {Component, ViewEncapsulation} from "@angular/core";
import {DynamicFormControl, FormControlComponent, IFormStaticData} from "../../common-types";

@Component({
    encapsulation: ViewEncapsulation.None,
    selector: "dynamic-form-static",
    templateUrl: "./dynamic-form-static.component.html"
})
export class DynamicFormStaticComponent extends FormControlComponent<IFormStaticData> {

    // Acceptor for provider
    static acceptor(control: DynamicFormControl): boolean {
        return control.type == "static";
    }

    // Loader for provider
    static loader(): Promise<any> {
        return Promise.resolve();
    }
}
