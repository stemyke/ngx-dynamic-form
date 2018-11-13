import {Component, OnInit, ViewChild} from "@angular/core";
import {IAsyncMessage} from "@stemy/ngx-utils";
import {IDynamicFormBase, IDynamicFormsConfigs} from "../public_api";
import {TestModel} from "./test.model";
import {SubModel} from "./sub.model";

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
            // {
            //     id: "test",
            //     data: new TestModel()
            // },
            {
                id: "sub",
                path: "address_sub",
                data: [
                    {
                        id: "a1",
                        path: "0",
                        classes: "col-sm-6",
                        data: new SubModel(),
                    },
                    {
                        id: "a2",
                        path: "1",
                        classes: "col-sm-6",
                        data: new SubModel(),
                    }
                ],
                multi: true,
                innerFormClasses: "row"
            }
        ]
    }
}
