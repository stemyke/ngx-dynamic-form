import {effect, OutputRef, signal, Signal, untracked} from "@angular/core";
import {Observable, Subscription} from "rxjs";
import {outputToObservable, toObservable as signalToObservable} from "@angular/core/rxjs-interop";

export function toObservable<T>(src: OutputRef<T> | Signal<T>): Observable<T> {
    if (typeof src === "object" && src.subscribe) {
        return outputToObservable(src as OutputRef<T>);
    }
    return signalToObservable(src as Signal<T>);
}

export function rxToSignal<T>(source: Signal<Observable<T>>, initial: T): Signal<T> {
    const result = signal(initial);
    effect(() => {
        const observable = source();
        let sub: Subscription = null;
        untracked(() => {
            sub = observable?.subscribe(value => {
                result.set(value);
            });
        });
        return sub?.unsubscribe();
    });
    return result;
}
