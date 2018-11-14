import {Directive, ElementRef, Inject, Input, OnDestroy, OnInit, Renderer2} from "@angular/core";
import {Subscription} from "rxjs";
import {AsyncMethod, AsyncMethodDirective, IToasterService, TOASTER_SERVICE} from "@stemy/ngx-utils";
import {IDynamicFormBase} from "../common-types";

@Directive({
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective extends AsyncMethodDirective implements OnInit, OnDestroy {

    @Input("async-submit") method: AsyncMethod;
    @Input() form: IDynamicFormBase;

    private callback: Function;
    private onStatusChange: Subscription;
    private onSubmit: Subscription;

    constructor(@Inject(TOASTER_SERVICE) toaster: IToasterService, elem: ElementRef, renderer: Renderer2) {
        super(toaster);
        if (elem.nativeElement.tagName !== "BUTTON") return;
        renderer.setAttribute(elem.nativeElement, "type", "button");
    }

    ngOnInit(): void {
        if (!this.form) return;
        this.disabled = status !== "VALID";
        this.onStatusChange = this.form.onStatusChange.subscribe(status => {
            this.disabled = status !== "VALID";
            if (!this.callback || status == "PENDING") return;
            if (!this.disabled) {
                this.callback();
            }
            this.callback = null;
        });
        this.onSubmit = this.form.onSubmit.subscribe(() => this.callMethod());
    }

    ngOnDestroy(): void {
        if (this.onStatusChange) this.onStatusChange.unsubscribe();
        if (this.onSubmit) this.onSubmit.unsubscribe();
    }

    click(): void {
        this.callback = () => super.click();
        if (this.form.status !== "VALID" && this.form.status !== "INVALID") return;
        this.callback();
        this.callback = null;
    }
}
