import {
    computed,
    Directive,
    effect,
    ElementRef,
    HostBinding,
    inject,
    input,
    Renderer2,
    signal,
    untracked
} from "@angular/core";
import {outputToObservable} from "@angular/core/rxjs-interop";
import {debounceTime} from "rxjs/operators";
import {AsyncMethodBase} from "@stemy/ngx-utils";

import {AsyncSubmitMethod, AsyncSubmitMode, IDynamicForm} from "../common-types";

@Directive({
    standalone: false,
    selector: "[async-submit]",
    exportAs: "async-submit",
    providers: [
        {provide: AsyncMethodBase, useExisting: AsyncSubmitDirective}
    ]
})
export class AsyncSubmitDirective extends AsyncMethodBase {

    readonly method = input<AsyncSubmitMethod>(null, {alias: "async-submit"});
    readonly mode = input<AsyncSubmitMode>("click");
    readonly form = input<IDynamicForm>();

    renderer = inject(Renderer2);
    elem = inject<ElementRef<HTMLElement>>(ElementRef);

    protected status = computed(() => {
        const form = this.form();
        return form?.status() || null;
    });

    protected group = computed(() => {
        const form = this.form();
        return form?.group() || null;
    });

    protected callback = signal<() => void>(null);

    @HostBinding("class.disabled")
    get isDisabled(): boolean {
        return this.status() !== "VALID";
    }

    @HostBinding("class.loading")
    get isLoading(): boolean {
        return this.loading();
    }

    constructor() {
        super();
        if (this.elem.nativeElement.tagName === "BUTTON") {
            this.renderer.setAttribute(this.elem.nativeElement, "type", "button");
        }
        effect(() => {
            const status = this.status();
            const cb = this.callback();
            if (!cb || status == "PENDING") return;
            if (status === "VALID") {
                cb();
            }
            this.callback.set(null);
        });
        effect(() => {
            const form = this.form();
            const mode = this.mode();
            if (!form || mode === "click") return;
            const sub = outputToObservable(form.onSubmit)
                .pipe(debounceTime(200)).subscribe(() => this.callMethod());
            return () => sub.unsubscribe();
        });
    }

    protected handleClick(ev: MouseEvent): boolean {
        ev?.preventDefault();
        const mode = untracked(() => this.mode());
        if (mode === "submit") return false;
        const status = untracked(() => this.status());
        if (status !== "VALID" && status !== "INVALID") {
            this.callback.set(() => this.callMethod());
            return false;
        }
        this.callMethod(ev);
        return true;
    }

    protected getMethod() {
        return untracked(() => this.method());
    }

    protected getArgs(ev: MouseEvent): unknown[] {
        return untracked(() => [this.form(), this.context(), ev]);
    }
}
