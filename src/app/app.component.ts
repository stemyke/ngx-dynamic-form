import {Component, ViewChild} from "@angular/core";
import {IAsyncMessage} from "@stemy/ngx-utils";
import {IDynamicForm, IDynamicFormBase, IDynamicFormConfig} from "../public_api";
import {TestModel} from "./test.model";
import {SubModel} from "./sub.model";

@Component({
    moduleId: module.id,
    selector: "app-root",
    templateUrl: "./app.component.html"
})
export class AppComponent {

    data: IDynamicFormConfig[];

    @ViewChild("form")
    private form: IDynamicFormBase;

    serialize = (): Promise<IAsyncMessage> => {
        return new Promise<IAsyncMessage>(resolve => {
            this.form.serialize(true).then(res => {
                console.log(res);
                resolve({
                    message: "Jejj"
                });
            }, () => {
                console.log("INVALID FORM");
                resolve();
            });
        });
    };

    newModel(): void {
        this.data = [
            {
                id: "test",
                data: new TestModel(),
            },
            {
                id: "sub",
                path: "address2",
                data: new SubModel(),
            }
        ]
    }
}
