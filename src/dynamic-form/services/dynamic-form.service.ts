import {ComponentFactoryResolver, Inject, Injectable, Injector, ViewContainerRef} from "@angular/core";
import "rxjs/Rx";
import {FORM_CONTROL_PROVIDER, IFormControl, IFormControlComponent, IFormControlProvider} from "../dynamic-form.types";

@Injectable()
export class DynamicFormService {

    constructor(@Inject(FORM_CONTROL_PROVIDER) private components: IFormControlProvider[], private resolver: ComponentFactoryResolver, private injector: Injector) {
    }

    createComponent(vcr: ViewContainerRef, control: IFormControl): IFormControlComponent {
        const provider = this.components.find(p => p.accept(control));
        if (!provider) {
            throw new Error(`No component provider for control: ${JSON.stringify(control)}`);
        }
        const factory = this.resolver.resolveComponentFactory(provider.component);
        vcr.clear();
        const component = vcr.createComponent(factory).instance;
        return component;
    }
}
