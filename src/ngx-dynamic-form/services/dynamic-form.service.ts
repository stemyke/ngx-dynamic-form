import {ComponentFactoryResolver, Inject, Injectable, ViewContainerRef} from "@angular/core";
import {FORM_CONTROL_PROVIDER, IFormControl, IFormControlComponent, IFormControlProvider} from "../common-types";

@Injectable()
export class DynamicFormService {

    constructor(@Inject(FORM_CONTROL_PROVIDER) private components: IFormControlProvider[], private resolver: ComponentFactoryResolver) {
    }

    findProvider(control: IFormControl): IFormControlProvider {
        if (!control) return null;
        const provider = this.components.find(p => p.acceptor(control));
        if (!provider) {
            throw new Error(`No component provider for control: ${JSON.stringify(control)}`);
        }
        return provider;
    }

    createComponent(vcr: ViewContainerRef, provider: IFormControlProvider): IFormControlComponent {
        vcr.clear();
        if (!provider) return null;
        const factory = this.resolver.resolveComponentFactory(provider.component);
        return vcr.createComponent(factory).instance;
    }
}
