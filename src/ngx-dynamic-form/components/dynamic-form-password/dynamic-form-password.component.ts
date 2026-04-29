import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    signal,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import {DynamicFieldType} from "../base/dynamic-field-type";

@Component({
    standalone: false,
    selector: "dynamic-form-password",
    templateUrl: "./dynamic-form-password.component.html",
    styleUrls: ["./dynamic-form-password.component.scss"],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormPasswordComponent extends DynamicFieldType {
    readonly type = signal("password");
    readonly icon = computed(() => {
        return this.type() === "password" ? "eye" : "eye-slash";
    });
    readonly input = viewChild.required<ElementRef<HTMLInputElement>>("input");

    switchType(): void {
        const el = this.input().nativeElement;
        const start = el.selectionStart;
        const end = el.selectionEnd;

        this.type.update(value => value === "password" ? "text" : "password");

        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(start, end);
        });
    }
}
