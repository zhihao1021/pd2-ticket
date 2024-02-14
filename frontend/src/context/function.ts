import {
    createContext,
    Dispatch,
    SetStateAction,
} from "react";

import MessageBox from "schemas/messageBox";

export interface FunctionData {
    setLoading?: Dispatch<SetStateAction<boolean>>,
    addMessageBox?: (data: MessageBox) => void
};

const functionContext = createContext<FunctionData>({});
export default functionContext;
