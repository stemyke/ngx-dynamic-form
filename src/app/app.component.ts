import {Component, OnInit, ViewChild} from "@angular/core";
import {IAsyncMessage} from "@stemy/ngx-utils";
import {IDynamicForm, IDynamicFormBase, IDynamicFormConfig} from "../public_api";
import {TestModel} from "./test.model";
import {SubModel} from "./sub.model";

@Component({
    moduleId: module.id,
    selector: "app-root",
    templateUrl: "./app.component.html"
})
export class AppComponent implements OnInit {

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

    ngOnInit(): void {
        this.newModel();
    }

    newModel(): void {
        this.data = [
            {
                id: "test",
                data: new TestModel(),
                classes: "row",
                formClasses: "col-sm-6"
            },
            {
                id: "sub",
                path: "address2",
                data: new SubModel(),
                classes: "row",
                formClasses: "col-sm-6"
            }
        ]
    }
}
