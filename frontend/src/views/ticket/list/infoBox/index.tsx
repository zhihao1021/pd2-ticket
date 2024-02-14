import {
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Link
} from "react-router-dom";

import TicketData from "schemas/ticket";

import { deleteTicket, getTicketInfo } from "api/ticket";

import dataContext from "context/data";
import functionContext from "context/function";

import SmallLoading from "component/smallLoading";

import UTCTimestamp2String from "utils/cvtTime";

import "./index.scss";


type propsType = Readonly<{
    ticketId: string,
    userId?: string
    refreshList: (ticketId?: string) => void,
    edit: (ticketId: string, isPublic: boolean) => void,
    state?: boolean,
}>;

export default function InfoBox(props: propsType): ReactElement {
    const {
        ticketId,
        userId,
        refreshList,
        edit,
        state
    } = props;

    const { userData } = useContext(dataContext);
    const {
        addMessageBox,
        setLoading
    } = useContext(functionContext);

    const [open, setOpen] = useState<boolean>(state ?? false);
    const [ticketConfig, setTicketConfig] = useState<TicketData | undefined>();

    const pathUserId = userId === undefined ? userData?.id : userId;

    const preivewName = useMemo(() => {
        try {
            const timestamp = ticketId.split(".")[0];
            const hash = ticketId.split("H")[1];
            const [date, time] = timestamp.split("T");

            return `${date.replaceAll("-", "/")} ${time.replaceAll("_", ":")} ${hash.slice(0, 8)}`
        }
        catch {
            return ticketId;
        }
    }, [ticketId]);

    const isSelf = useMemo(() => {
        return userId === undefined || userId === userData?.id;
    }, [userId, userData?.id]);

    const updateConfig = useCallback(() => {
        getTicketInfo(
            ticketId,
            userId
        ).then(setTicketConfig)
    }, [ticketId, userId]);

    const deleteTicketButton = useCallback(() => {
        if (!isSelf) return;
        if (setLoading) setLoading(true);
        deleteTicket(ticketId).then(() => {
            if (!addMessageBox) return;
            addMessageBox({
                level: "INFO",
                context: "Delete succeed"
            });
            refreshList(ticketId);
        }).catch(() => {
            if (!addMessageBox) return;
            addMessageBox({
                level: "ERROR",
                context: "Delete failed"
            });
            refreshList();
        }).finally(() => {
            if (setLoading) setLoading(false);
        })
    }, [isSelf, ticketId, addMessageBox, setLoading, refreshList]);

    useEffect(() => {
        setTicketConfig(undefined);
    }, [ticketId, userId]);

    useEffect(() => {
        if (!open || ticketConfig !== undefined) return;
        updateConfig()
    }, [open, ticketConfig, updateConfig]);

    return (
        <div className="infoBox" data-open={open} data-self={isSelf}>
            <div className="preview">
                <Link to={`/ticket/${pathUserId}/${ticketId}`} className="ticketId">{preivewName}</Link>
                <button className="ms-o" onClick={() => setOpen(v => !v)}>expand_more</button>
            </div>
            <div className="content">
                {
                    ticketConfig === undefined ? <SmallLoading /> : <div className="data">
                        <div className="column">
                            <div className="key">Create at</div>
                            <div className="value">{UTCTimestamp2String(ticketConfig.create_utc_timestamp)}</div>
                        </div>
                        <div className="column">
                            <div className="key">Access Control</div>
                            <div className="value">{ticketConfig.public ? "Public" : "Private"}</div>
                        </div>
                        <div className="buttonBar">
                            <button className="edit ani-btn" disabled={!isSelf} onClick={() => edit(ticketId, ticketConfig.public)}>Edit</button>
                            <button className="delete ani-btn" disabled={!isSelf} onClick={deleteTicketButton}>Delete</button>
                        </div>
                    </div>
                }
            </div>
        </div>
    );
};
