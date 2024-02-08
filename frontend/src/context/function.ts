import {
    createContext,
    Dispatch,
    SetStateAction,
} from "react";

export interface FunctionData {
    setLoading?: Dispatch<SetStateAction<boolean>>
};

const functionContext = createContext<FunctionData>({});
export default functionContext;
