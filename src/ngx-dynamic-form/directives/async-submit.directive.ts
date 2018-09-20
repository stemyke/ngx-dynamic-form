import {Directive, Input, OnDestroy, OnInit} from "@angular/core";
import {Subscription} from "rxjs";
import {AsyncMethod, AsyncMethodDirective} from "@stemy/ngx-utils";
import {IDynamicForm} from "../common-types";

@Directive({
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective extends AsyncMethodDirective implements OnInit, OnDestroy {

    @Input("async-submit") method: AsyncMethod;
    @Input() form: IDynamicForm;

    private onChange: Subscription;
    private onSubmit: Subscription;

    ngOnInit(): void {
        if (!this.form) return;
        this.onChange = this.form.onChange.subscribe(() => this.disabled = !this.form.isValid);
        this.onSubmit = this.form.onSubmit.subscribe(() => this.callMethod());
    }

    ngOnDestroy(): void {
        if (this.onChange) this.onChange.unsubscribe();
        if (this.onSubmit) this.onSubmit.unsubscribe();
    }
}
