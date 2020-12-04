import {Injectable} from "@angular/core";
import {DynamicFormControlModel, DynamicFormValidationService as Base} from "@ng-dynamic-forms/core";
import {AbstractControl} from "@angular/forms";

@Injectable()
export class DynamicFormValidationService extends Base {

    showErrorMessages(control: AbstractControl, model: DynamicFormControlModel, hasFocus: boolean): boolean {
        console.log(model.id, super.showErrorMessages(control, model, hasFocus));
        return super.showErrorMessages(control, model, hasFocus);
    }
}
