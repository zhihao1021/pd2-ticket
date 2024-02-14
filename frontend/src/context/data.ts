import {
    createContext,
} from "react";

import UserData from "schemas/user";

export interface Data {
    userData?: UserData
};

const dataContext = createContext<Data>({});
export default dataContext;
