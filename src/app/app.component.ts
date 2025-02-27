import {Component, OnInit, ViewChild} from "@angular/core";
import {IAsyncMessage} from "@stemy/ngx-utils";
import {IDynamicForm, DynamicFormService, createFormInput} from "@stemy/ngx-dynamic-form";
import {FormGroup} from "@angular/forms";
import {DynamicFormModel} from "@ng-dynamic-forms/core";

@Component({
    standalone: false,
    selector: "app-root",
    templateUrl: "./app.component.html"
})
export class AppComponent implements OnInit {

    formModel: DynamicFormModel;
    formGroup: FormGroup;

    constructor(private forms: DynamicFormService) {

    }

    serialize = (form: IDynamicForm): Promise<IAsyncMessage> => {
        return new Promise<IAsyncMessage>(resolve => {
            this.forms.serializeForm(form, true).then(res => {
                console.log(res);
                resolve({
                    message: "Jejj"
                });
            }, () => {
                console.log("INVALID FORM");
                resolve(null);
            });
        });
    };

    ngOnInit(): void {
        this.newModel();
    }

    newModel(): void {
        this.formModel = [
            createFormInput("test", {})
        ];
        this.formGroup = this.forms.createFormGroup(this.formModel);
    }
}
