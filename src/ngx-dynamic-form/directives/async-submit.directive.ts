import {Directive, ElementRef, Inject, Input, OnDestroy, OnInit, Renderer2} from "@angular/core";
import {Subscription} from "rxjs";
import {AsyncMethod, AsyncMethodDirective, IToasterService, TOASTER_SERVICE} from "@stemy/ngx-utils";
import {IDynamicForm} from "../common-types";

@Directive({
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective extends AsyncMethodDirective implements OnInit, OnDestroy {

    @Input("async-submit") method: AsyncMethod;
    @Input() form: IDynamicForm;

    private onValidate: Subscription;
    private onSubmit: Subscription;
    private validation: Promise<IDynamicForm>;

    constructor(@Inject(TOASTER_SERVICE) toaster: IToasterService, elem: ElementRef, renderer: Renderer2) {
        super(toaster);
        if (elem.nativeElement.tagName !== "BUTTON") return;
        renderer.setAttribute(elem.nativeElement, "type", "button");
    }

    ngOnInit(): void {
        if (!this.form) return;
        this.onValidate = this.form.onValidate.subscribe(validation => {
            this.validation = validation;
            validation.then(() => {
                this.disabled = false;
                this.validation = null;
            }, () => {
                this.disabled = true;
                this.validation = null;
            });
            this.disabled = !this.form.isValid;
        });
        this.onSubmit = this.form.onSubmit.subscribe(() => this.callMethod());
    }

    ngOnDestroy(): void {
        if (this.onValidate) this.onValidate.unsubscribe();
        if (this.onSubmit) this.onSubmit.unsubscribe();
    }

    click(): void {
        const callback = () => super.click();
        if (this.validation) {
            this.validation.then(callback, callback);
            return;
        }
        callback();
    }
}
