import {ComponentFactoryResolver, Inject, Injectable, ViewContainerRef} from "@angular/core";
import {FORM_CONTROL_PROVIDER, IFormControl, IFormControlComponent, IFormControlProvider} from "../dynamic-form.types";

@Injectable()
export class DynamicFormService {

    constructor(@Inject(FORM_CONTROL_PROVIDER) private components: IFormControlProvider[], private resolver: ComponentFactoryResolver) {
    }

    createComponent(vcr: ViewContainerRef, control: IFormControl): IFormControlComponent {
        vcr.clear();
        if (!control) return;
        const provider = this.components.find(p => p.accept(control));
        if (!provider) {
            throw new Error(`No component provider for control: ${JSON.stringify(control)}`);
        }
        const factory = this.resolver.resolveComponentFactory(provider.component);
        return vcr.createComponent(factory).instance;
    }
}
