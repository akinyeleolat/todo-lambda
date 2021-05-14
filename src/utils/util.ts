
import validate from 'validate.js/validate';

// Models
import ResponseModel from "../models/response.model";

// Types
type IGeneric<T> = {
    [index in string | number | any]: T;
};

/**
 * Validate values against constraints
 * @param values
 * @param constraints
 * @return {Promise<any>}
 */
export const validateAgainstConstraints = (values: IGeneric<string>, constraints: IGeneric<object>) => {

    return new Promise<void>((resolve, reject) => {
        const validation = validate(values, constraints);

        if (typeof validation === 'undefined') {
            resolve();
        } else {
            reject(new ResponseModel({ validation }, 400, 'required fields are missing'));
        }
    });
}