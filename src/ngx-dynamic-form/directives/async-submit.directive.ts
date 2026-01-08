import {
    computed,
    Directive,
    effect,
    ElementRef,
    HostBinding,
    HostListener,
    inject,
    input,
    output,
    Renderer2,
    signal,
    untracked
} from "@angular/core";
import {outputToObservable} from "@angular/core/rxjs-interop";
import {debounceTime} from "rxjs/operators";
import {IAsyncMessage, TOASTER_SERVICE} from "@stemy/ngx-utils";

import {AsyncSubmitMethod, AsyncSubmitMode, IDynamicForm} from "../common-types";

@Directive({
    standalone: false,
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective {

    readonly method = input<AsyncSubmitMethod>(null, {alias: "async-submit"});
    readonly mode = input<AsyncSubmitMode>("click");
    form = input<IDynamicForm>();
    context = input<any>();

    onSuccess = output<IAsyncMessage>();
    onError = output<IAsyncMessage>();

    toaster = inject(TOASTER_SERVICE);
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

    protected loading = signal(false);
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

    @HostListener("click")
    click(): void {
        console.log("CLICK");
        const mode = untracked(() => this.mode());
        if (mode === "submit") return;
        const status = untracked(() => this.status());
        if (status !== "VALID" && status !== "INVALID") {
            this.callback.set(() => this.callMethod());
            return;
        }
        this.callMethod();
    }

    callMethod(): void {
        const loading = untracked(() => this.loading());
        if (loading) return;
        this.loading.set(true);
        const [method, form, context] = untracked(() => [this.method(), this.form(), this.context()]);
        method(form, context).then(result => {
            this.loading.set(false);
            if (result) {
                this.onSuccess.emit(result);
                this.toaster.success(result.message, result.context);
            }
        }, reason => {
            if (!reason || !reason.message)
                throw new Error("Reason must implement IAsyncMessage interface");
            this.loading.set(false);
            this.onError.emit(reason);
            this.toaster.error(reason.message, reason.context);
        });
    }
}
