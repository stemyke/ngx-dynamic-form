import {Component, OnInit, ViewChild} from "@angular/core";
import {IAsyncMessage} from "@stemy/ngx-utils";
import {IDynamicForm} from "../public_api";

@Component({
    moduleId: module.id,
    selector: "app-root",
    templateUrl: "./app.component.html"
})
export class AppComponent implements OnInit {

    data: any;

    @ViewChild("form")
    private form: IDynamicForm;

    serialize = (): Promise<IAsyncMessage> => {
        return new Promise<IAsyncMessage>(resolve => {
            this.form.serialize(true).then(res => {
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
        this.data = [];
    }
}
