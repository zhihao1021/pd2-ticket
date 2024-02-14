import { AxiosError } from "axios";
import {
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import FastAPIError from "schemas/error";
import UserData from "schemas/user";

import { getTicketList } from "api/ticket";
import { getUserInfo } from "api/user";

import dataContext from "context/data";
import functionContext from "context/function";

import NotFound from "component/notFound";
import SmallLoading from "component/smallLoading";

import EditBox from "./editBox";
import InfoBox from "./infoBox";

import "./index.scss";

export default function ListPgae(): ReactElement {
    const { userId } = useParams();
    const pathUserId = parseInt(userId || "") ? userId : undefined;

    const [ticketList, setTicketList] = useState<Array<string> | undefined>();
    const [reverse, setReverse] = useState<boolean>(false);
    const [refreshButton, setRefreshButton] = useState<boolean>(false);
    const [displayUser, setDisplayUser] = useState<UserData | undefined>(undefined);
    const [editTicket, setEditTicket] = useState<{
        ticketId?: string | undefined,
        isPublic: boolean,
    }>({ isPublic: false });
    const [lastEdit, setLastEdit] = useState<string>("");

    const {
        addMessageBox,
    } = useContext(functionContext);
    const {
        userData
    } = useContext(dataContext);

    const setNavigate = useNavigate();

    const refreshList = useCallback((ticketId?: string) => {
        if (ticketId === undefined) setTicketList(undefined);
        else setTicketList(v => v?.filter(t => t !== ticketId));
    }, [setTicketList]);

    const openEdit = useCallback((ticketId: string, isPublic: boolean) => {
        setEditTicket({ ticketId: ticketId, isPublic: isPublic });
        setLastEdit(ticketId);
    }, []);

    const closeEdit = useCallback((refresh: boolean) => {
        setEditTicket(v => ({ ticketId: undefined, isPublic: v.isPublic }));
        if (refresh) refreshList();
    }, [refreshList]);

    useEffect(() => {
        if (userData === undefined) return;
        if (ticketList === undefined) {
            if (pathUserId !== undefined && pathUserId !== userData?.id) {
                if (userData?.is_admin) {
                    getUserInfo(pathUserId).then(v => setDisplayUser(v))
                }
                else {
                    setNavigate("..")
                    return;
                }
            }
            else {
                setDisplayUser(undefined);
            }

            getTicketList(pathUserId).then(
                v => setTicketList(v)
            ).catch((error: AxiosError) => {
                if (error.response && addMessageBox) {
                    const data: FastAPIError = error.response.data as FastAPIError;
                    addMessageBox({
                        level: "ERROR",
                        context: `Get ticket list failed, detail: ${data.detail}`
                    });
                }
            });
        };
    }, [ticketList, addMessageBox, pathUserId, userData, setNavigate]);

    useEffect(() => {
        if (refreshButton) setTimeout(
            () => setRefreshButton(false),
            1000,
        )
    }, [refreshButton]);

    const sortedList = useMemo(() => {
        if (ticketList === undefined) return undefined;
        const ticket2num = (tid: string) => {
            let timestamp = tid.split("H")[0];
            return parseInt(
                Array.from(timestamp).filter(v => v >= "0" && v <= "9").join("")
            );
        }
        let newTicketList = Array.from(ticketList);
        newTicketList.sort((a, b) => {
            return (ticket2num(b) - ticket2num(a)) * (reverse ? -1 : 1);
        })
        return newTicketList;
    }, [ticketList, reverse]);

    return (
        <div id="listPage" className="page">
            <h1>{"Ticket List" + (displayUser ? ` - ${displayUser?.display_name}` : "")}</h1>
            <EditBox isPublic={editTicket.isPublic} ticketId={editTicket.ticketId} close={closeEdit}/>
            <div className="content">
                <div className="toolBar">
                    <button className="sort" onClick={() => setReverse(v => !v)}>
                        <span>Time</span>
                        <span className="ms-o" data-sort={reverse}>sort</span>
                    </button>
                    <button className="refresh" data-active={refreshButton} onClick={() => {
                        setLastEdit("");
                        setTicketList(undefined);
                        setRefreshButton(true);
                    }}>
                        <span>Refresh</span>
                        <span className="ms-o">refresh</span>
                    </button>
                </div>
                {
                    sortedList === undefined ? <SmallLoading /> : (
                        sortedList.length === 0 ? <NotFound /> : sortedList.map(
                            (v, i) => <InfoBox
                                key={i}
                                ticketId={v}
                                userId={pathUserId}
                                refreshList={refreshList}
                                edit={openEdit}
                                state={lastEdit === v}
                            />
                        )
                    )
                }
            </div>
        </div>
    );
};
