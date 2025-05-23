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
    signal
} from "@angular/core";
import {debounceTime} from "rxjs/operators";
import {IAsyncMessage, TOASTER_SERVICE} from "@stemy/ngx-utils";

import {AsyncSubmitMethod, IDynamicForm} from "../common-types";
import {toObservable} from "../utils/signals";

@Directive({
    standalone: false,
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective {

    method = input<AsyncSubmitMethod>(null, {alias: "async-submit"});
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
        effect(() => {
            if (this.elem.nativeElement.tagName === "BUTTON") {
                this.renderer.setAttribute(this.elem.nativeElement, "type", "button");
            }
        });
        effect(() => {
            if (this.status() !== "VALID") {
                this.renderer.setAttribute(this.elem.nativeElement, "disabled", "disabled");
                return;
            }
            this.renderer.removeAttribute(this.elem.nativeElement, "disabled");
        });
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
            if (!form) return;
            const sub = toObservable(form.onSubmit)
                .pipe(debounceTime(200)).subscribe(() => this.callMethod());
            return () => sub.unsubscribe();
        });
    }

    @HostListener("click")
    click(): void {
        const status = this.status();
        if (status !== "VALID" && status !== "INVALID") {
            this.callback.set(() => this.callMethod());
            return;
        }
        this.callMethod();
    }

    callMethod(): void {
        if (this.loading()) return;
        this.loading.set(true);
        this.method()(this.form(), this.context).then(result => {
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
