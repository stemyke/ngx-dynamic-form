import {Component} from "@angular/core";
import {TestModel} from "./test.model";

@Component({
    moduleId: module.id,
    selector: "app-root",
    templateUrl: "./app.component.html"
})
export class AppComponent {
    testModel = new TestModel();
}
