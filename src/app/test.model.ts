import {FormInput} from "../public_api";

export class TestModel {

    @FormInput()
    name: string = "Béla";

    @FormInput()
    password: string = "Józsi";

    @FormInput()
    num: number = 0;

    @FormInput({
        step: 0.1
    })
    num2: number = 10;

    @FormInput({
        type: "date"
    })
    date: Date = new Date();

}
