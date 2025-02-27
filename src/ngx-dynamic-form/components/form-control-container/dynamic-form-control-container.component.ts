import {ChangeDetectionStrategy, Component, ViewEncapsulation} from "@angular/core";
import {DynamicBaseFormControlContainerComponent} from "@stemy/ngx-dynamic-form";

@Component({
    standalone: false,
    selector: "dynamic-form-control-container",
    templateUrl: "./dynamic-form-control-container.component.html",
    styleUrls: ["./dynamic-form-control-container.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {provide: DynamicBaseFormControlContainerComponent, useExisting: DynamicFormControlContainerComponent}
    ]
})
export class DynamicFormControlContainerComponent extends DynamicBaseFormControlContainerComponent {

    getLabelIcon(): string {
        const icon = super.getLabelIcon();
        switch (icon) {
            case "asc":
                return "arrowhead-down-outline";
            case "desc":
                return "arrowhead-up-outline";
        }
        return icon;
    }

}
