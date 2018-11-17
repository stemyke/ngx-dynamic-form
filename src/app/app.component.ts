import {Component, OnInit, ViewChild} from "@angular/core";
import {IAsyncMessage, ObjectUtils} from "@stemy/ngx-utils";
import {IDynamicFormBase, IDynamicFormsConfigs} from "../public_api";
import {SubModel} from "./sub.model";
import {TestModel} from "./test.model";

@Component({
    moduleId: module.id,
    selector: "app-root",
    templateUrl: "./app.component.html"
})
export class AppComponent implements OnInit {

    data: IDynamicFormsConfigs;

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
                data: new TestModel()
            }
        ];
    }
}
