import { AxiosError } from "axios";
import {
    CSSProperties,
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import FastAPIError from "schemas/error";
import TicketData from "schemas/ticket";
import UserData from "schemas/user";

import { downloadTicketZip, getTicketFileContent, getTicketInfo } from "api/ticket";
import { getUserInfo } from "api/user";

import functionContext from "context/function";

import SmallLoading from "component/smallLoading";

import UTCTimestamp2String from "utils/cvtTime";
import downloadBlob from "utils/download";

import "./index.scss";

export default function ContentPage(): ReactElement {
    const {
        userId,
        ticketId,
        filename,
    } = useParams();
    console.log(userId, ticketId, filename)

    const [ticketConfig, setTicketConfig] = useState<TicketData | undefined>(undefined);
    const [author, setAuthor] = useState<UserData | undefined>(undefined);
    const [filenameTemp, setfilenameTemp] = useState<string>("");
    const [displayFileTemp, setDisplayFileTemp] = useState<string>("");
    const [displayFile, setDisplayFile] = useState<string | undefined>(undefined);
    const [fileLoading, setFileLoading] = useState<boolean>(false);
    const [copyDone, setCopyDone] = useState<boolean>(false);

    const {
        addMessageBox
    } = useContext(functionContext);

    const setNavigate = useNavigate();

    const copyContent = useCallback(() => {
        navigator.clipboard.writeText(displayFileTemp).then(() => {
            setCopyDone(true);
            setTimeout(() => setCopyDone(false), 1000);
        });
    }, [displayFileTemp]);

    const downloadZip = useCallback(() => {
        if (ticketConfig === undefined) return;
        if (addMessageBox) addMessageBox({
            level: "INFO",
            context: `Start download`
        })
        downloadTicketZip(
            ticketConfig.ticket_id,
            ticketConfig.author_id
        ).then(
            blob => {
                downloadBlob(blob, "download.zip");
                if (addMessageBox) addMessageBox({
                    level: "INFO",
                    context: `Download finished`
                })
            }
        ).catch((error: AxiosError) => {
            if (error.response && addMessageBox) {
                const data = error.response.data as FastAPIError;
                addMessageBox({
                    level: "ERROR",
                    context: `Download failed, ${data.detail}`
                })
            }
        })
    }, [addMessageBox, ticketConfig]);

    useEffect(() => {
        if (displayFile === undefined) return;
        setDisplayFileTemp(displayFile)
    }, [displayFile]);
    useEffect(() => {
        if (filename === undefined) return;
        setfilenameTemp(filename)
    }, [filename]);

    useEffect(() => {
        if (ticketConfig === undefined) return;
        if (filename === undefined) {
            setDisplayFile(undefined);
            return;
        }
        setFileLoading(true);
        getTicketFileContent(
            ticketConfig.ticket_id,
            filename,
            ticketConfig.author_id,
        ).then(v => {
            setDisplayFile(v);
        }).catch((error: AxiosError) => {
            if (error.response && addMessageBox) {
                const data = error.response.data as FastAPIError;
                addMessageBox({
                    level: "ERROR",
                    context: `Get file content failed, ${data.detail}`
                })
            }
            setNavigate("..")
        }).finally(() => {
            // setTimeout(() => setFileLoading(false), 2500);
            setFileLoading(false)
        })
    }, [ticketConfig, addMessageBox, filename, setNavigate]);

    useEffect(() => {
        setDisplayFile(undefined);
        setFileLoading(true);
        if (ticketConfig === undefined) {
            setAuthor(undefined);
            return;
        }
        getUserInfo(ticketConfig.author_id).then((userData) => {
            setAuthor(userData);
            setFileLoading(false);
        })
    }, [ticketConfig]);

    useEffect(() => {
        if (ticketId === undefined || userId === undefined) {
            setTicketConfig(undefined);
            setNavigate("/ticket");
            return
        }
        if (ticketId === ticketConfig?.ticket_id) {
            return;
        }

        getTicketInfo(ticketId, userId).then((ticketData) => {
            setTicketConfig(ticketData);
        }).catch(() => {
            if (addMessageBox) addMessageBox({
                level: "ERROR",
                context: "Get ticket info failed"
            });
            setNavigate("/ticket");
        })
    }, [ticketId, userId, addMessageBox, setNavigate, ticketConfig?.ticket_id]);

    return (
        <div id="contentPage" className="page">
            <h1>Ticket</h1>
            <div className="infoBox" data-show={ticketConfig !== undefined && author !== undefined}>
                <SmallLoading />
                <div className="data">
                    <div className="column full">
                        <div className="key">ID</div>
                        <div className="value">{ticketId}</div>
                    </div>
                    <div className="column">
                        <div className="key">Author</div>
                        <div className="value">
                            <img alt="author" src={author ? author.display_avatar : ""} />
                            <div>{author ? author.display_name : ""}</div>
                        </div>
                    </div>
                    <div className="column">
                        <div className="key">Create Time</div>
                        <div className="value">{ticketConfig ? UTCTimestamp2String(ticketConfig.create_utc_timestamp) : ""}</div>
                    </div>
                    <div className="column">
                        <div className="key">Access Control</div>
                        <div className="value">{ticketConfig ? (ticketConfig.public ? "Public" : "Private") : ""}</div>
                    </div>
                </div>
            </div>
            <div className="contentBox">
                <SmallLoading data-show={ticketConfig === undefined || author === undefined || fileLoading} />
                <div className="fileList" data-show={ticketConfig !== undefined && author !== undefined && displayFile === undefined && !fileLoading}>
                    <h2>Files</h2>
                    <button className="download titleButton" onClick={downloadZip}>
                        <div className="ms-o">download</div>
                        <div>.zip</div>
                    </button>
                    <pre className="container" style={{
                        "--length": Math.max(...ticketConfig?.files.map(v => v.length) || [0])
                    } as CSSProperties}>
                        <code>
                            {
                                ticketConfig?.files.map((v, i) => <span
                                    key={i}
                                ><Link to={v.replaceAll("/", "%2F")}>{v}</Link></span>)
                            }
                        </code>
                    </pre>
                </div>
                <div className="fileContent" data-show={displayFile !== undefined && !fileLoading}>
                    <h2>{filenameTemp}</h2>
                    <button className="back titleButton" onClick={() => setNavigate("./..")}>
                        <div className="ms-o">undo</div>
                        <div>Back</div>
                    </button>
                    <pre className="container line">
                        <code className="line">{displayFileTemp.split("\n").map((_, i) => <span key={i}>
                            {i + 1}
                        </span>)}</code>
                        <code>{displayFileTemp.split("\n").map((v, i) => <span
                            key={i}
                            onSelect={() => { console.log("123") }}
                        >{v}</span>)}</code>
                    </pre>
                    <button
                        className="copy"
                        onClick={copyContent}
                        data-done={copyDone}
                    />
                </div>
            </div>
        </div>
    );
};
