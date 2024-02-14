import {
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import { modifyTicket } from "api/ticket";

import functionContext from "context/function";

import DropDownList from "component/dropDownList";

import "./index.scss";

type propsType = Readonly<{
    isPublic: boolean,
    ticketId?: string | undefined,
    close: (refresh: boolean) => void,
}>;

export default function EditBox(props: propsType): ReactElement {
    const {
        isPublic,
        ticketId,
        close,
    } = props;

    const {
        addMessageBox,
        setLoading,
    } = useContext(functionContext)

    const [accessState, setAccessState] = useState<boolean>(isPublic);

    useEffect(() => {
        setAccessState(isPublic);
    }, [isPublic]);

    const save = useCallback(() => {
        if (ticketId === undefined) return;
        if (setLoading) setLoading(true);
        modifyTicket(ticketId, { public: accessState }).then(() => {
            if (addMessageBox) {
                addMessageBox({
                    level: "INFO",
                    context: "Save succeed"
                });
            }
        }).catch(() => {
            if (addMessageBox) {
                addMessageBox({
                    level: "ERROR",
                    context: "Save failed"
                });
            }
        }).finally(() => {
            if (setLoading) setLoading(false);
            close(true);
        })
    }, [ticketId, accessState, close, addMessageBox, setLoading]);

    return (
        <div className="editBlock" data-show={ticketId !== undefined}>
            <div className="box">
                <h2>Edit</h2>
                <div className="column">
                    <div className="key">Access Control</div>
                    <DropDownList
                        options={["Public", "Private"]}
                        value={accessState ? 0 : 1}
                        onSelect={(option) => {
                            setAccessState(option === 0);
                        }}
                    />
                </div>
                <div className="buttonBar">
                    <button className="cancel ani-btn" onClick={() => close(false)}>Cancel</button>
                    <button className="save ani-btn" onClick={save}>Save</button>
                </div>
            </div>
        </div>
    )
}
