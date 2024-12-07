import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    EventEmitter,
    HostBinding,
    HostListener,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2
} from "@angular/core";
import {Subscription} from "rxjs";
import {debounceTime} from "rxjs/operators";
import {IAsyncMessage, IToasterService, TOASTER_SERVICE} from "@stemy/ngx-utils";
import {AsyncSubmitMethod, IDynamicForm} from "../common-types";
import {getFormValidationErrors} from "../utils/validation-errors";

@Directive({
    standalone: false,
    selector: "[async-submit]",
    exportAs: "async-submit"
})
export class AsyncSubmitDirective implements OnInit, OnDestroy {

    @Input("async-submit") method: AsyncSubmitMethod;
    @Input() form: IDynamicForm;
    @Input() context: any;

    @Output() onSuccess: EventEmitter<IAsyncMessage>;
    @Output() onError: EventEmitter<IAsyncMessage>;

    private loading: boolean;
    private disabled: boolean;
    private callback: Function;
    private onStatusChange: Subscription;
    private onSubmit: Subscription;

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
                readonly elem: ElementRef,
                readonly renderer: Renderer2) {
        this.onSuccess = new EventEmitter<IAsyncMessage>();
        this.onError = new EventEmitter<IAsyncMessage>();
        if (elem.nativeElement.tagName !== "BUTTON") return;
        renderer.setAttribute(elem.nativeElement, "type", "button");
    }

    ngOnInit(): void {
        if (!this.form) return;
        this.isDisabled = this.form.group?.status !== "VALID";
        this.cdr.detectChanges();
        this.onStatusChange = this.form.group?.statusChanges.subscribe(() => {
            const status = this.form.group?.status;
            this.isDisabled = status !== "VALID";
            this.cdr.detectChanges();
            if (!this.callback || status == "PENDING") return;
            if (!this.disabled) {
                this.callback();
            }
            this.callback = null;
        });
        this.onSubmit = this.form.onSubmit?.pipe(debounceTime(200)).subscribe(() => this.callMethod());
    }

    ngOnDestroy(): void {
        if (this.onStatusChange) this.onStatusChange.unsubscribe();
        if (this.onSubmit) this.onSubmit.unsubscribe();
    }

    @HostListener("click")
    click(): void {
        this.callback = () => this.callMethod();
        const status = this.form.group?.status;
        if (status === "INVALID") {
            console.log(getFormValidationErrors(this.form.group.controls));
        }
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
