import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Inject,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    Output,
    Renderer2,
    SimpleChanges
} from "@angular/core";
import {Subscription} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {IAsyncMessage, IToasterService, ObservableUtils, TOASTER_SERVICE} from "@stemy/ngx-utils";
import {AsyncSubmitMethod, IDynamicForm} from "../common-types";

@Directive({
    standalone: false,
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective implements OnChanges, OnDestroy {

    @Input("async-submit") method: AsyncSubmitMethod;
    @Input() form: IDynamicForm;
    @Input() context: any;

    @Output() onSuccess: EventEmitter<IAsyncMessage>;
    @Output() onError: EventEmitter<IAsyncMessage>;

    protected loading: boolean;
    protected disabled: boolean;
    protected callback: Function;
    protected subscription: Subscription;

    @HostBinding("class.disabled")
    get isDisabled(): boolean {
        return this.disabled;
    }

    set isDisabled(value: boolean) {
        this.disabled = value;
        if (value) {
            this.renderer.setAttribute(this.elem.nativeElement, "disabled", "disabled");
            return;
        }
        this.renderer.removeAttribute(this.elem.nativeElement, "disabled");
    }

    @HostBinding("class.loading")
    get isLoading(): boolean {
        return this.loading;
    }

    constructor(@Inject(TOASTER_SERVICE) private toaster: IToasterService,
                readonly cdr: ChangeDetectorRef,
                readonly zone: NgZone,
                readonly elem: ElementRef<HTMLElement>,
                readonly renderer: Renderer2) {
        this.onSuccess = new EventEmitter<IAsyncMessage>();
        this.onError = new EventEmitter<IAsyncMessage>();
        if (elem.nativeElement.tagName !== "BUTTON") return;
        renderer.setAttribute(elem.nativeElement, "type", "button");
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Clear old subscription
        this.subscription?.unsubscribe();
        // Check if form changed
        if (changes.form) {
            const form = changes.form.currentValue as IDynamicForm;
            if (!form) return;
            // Force form for checking changes after fields get autofilled by the browser
            // setTimeout(() => {
            //     console.log(
            //         this.elem.nativeElement,
            //         this.elem.nativeElement.focus
            //     );
            //     this.elem.nativeElement.focus?.();
            // }, 1500);
        }
        // Handle other things if we have a form instance
        if (!this.form) return;
        this.isDisabled = this.form.group?.status !== "VALID";
        this.cdr.detectChanges();
        this.subscription = ObservableUtils.multiSubscription(
            this.form.group?.statusChanges.subscribe(() => {
                const status = this.form.group?.status;
                this.isDisabled = status !== "VALID";
                this.cdr.detectChanges();
                if (!this.callback || status == "PENDING") return;
                if (!this.disabled) {
                    this.callback();
                }
                this.callback = null;
            }),
            this.form.onSubmit?.pipe(debounceTime(200)).subscribe(() => this.callMethod())
        )
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
    }

    @HostListener("click")
    click(): void {
        this.callback = () => this.callMethod();
        const status = this.form.group?.status;
        if (status !== "VALID" && status !== "INVALID") return;
        this.callback();
        this.callback = null;
    }

    callMethod(): void {
        if (this.loading) return;
        this.loading = true;
        this.method(this.form, this.context).then(result => {
            this.loading = false;
            if (result) {
                this.onSuccess.emit(result);
                this.toaster.success(result.message, result.context);
            }
        }, reason => {
            if (!reason || !reason.message)
                throw new Error("Reason must implement IAsyncMessage interface");
            this.loading = false;
            this.onError.emit(reason);
            this.toaster.error(reason.message, reason.context);
        });
    }
}
