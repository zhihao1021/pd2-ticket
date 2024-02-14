import {
    ChangeEvent,
    DragEvent,
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useState
} from "react";
import {
    useNavigate
} from "react-router-dom";

import dataContext from "context/data";
import functionContext from "context/function";

import { uploadTicket } from "api/ticket";

import traverseFileTree from "utils/traverseFileTree";

import "./index.scss";
import DropDownList from "component/dropDownList";

export default function CreatePage(): ReactElement {
    const [selectFiles, setSelectFiles] = useState<Array<File>>([]);
    const [onDrag, setOnDrag] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [isPublic, setIsPublic] = useState<boolean>(false);

    const {
        userData,
    } = useContext(dataContext);
    const {
        addMessageBox,
        setLoading,
    } = useContext(functionContext);

    const setNavigate = useNavigate();

    const selectFile = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        const fileList = event.target.files;
        if (fileList === null) {
            setSelectFiles([]);
            return;
        }
        const files = Array.from(fileList);
        setSelectFiles(files);
    }, []);
    
    const dragFile = useCallback((event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        Array.from(event.dataTransfer.items).forEach(item => {
            const file = item.webkitGetAsEntry();
            if (file === null) return;
            traverseFileTree(file, "", file_r => {
                setSelectFiles(v => [...v, file_r]);
            });
        });
    }, []);

    const uploadFile = useCallback(() => {
        if (setLoading) setLoading(true);
        uploadTicket(selectFiles, isPublic).then(
            ticketId => {
                if (addMessageBox) addMessageBox({
                    level: "INFO",
                    context: "Upload succeed"
                })
                setNavigate(`/ticket/${userData?.id}/${ticketId}`)
            }
        ).catch(() => {
            if (addMessageBox) addMessageBox({
                level: "ERROR",
                context: "Upload failed"
            });
        }).finally(
            () => {
                if (setLoading) setLoading(false);
            });
    }, [addMessageBox, setLoading, setNavigate, selectFiles, isPublic, userData?.id]);

    useEffect(() => {
        console.log(selectFiles.map(f => f.name))
    }, [selectFiles]);
    
    return (
        <div id="createPage" className="page">
            <h1>Create Ticket</h1>
            <div
                className="uploadBlock"
                onDrop={dragFile}
                onDragOver={(ev) => ev.preventDefault()}
            >
                {
                    selectFiles.length === 0 ?
                        <label
                            className="uploadBox"
                            onDragEnter={() => setOnDrag(true)}
                            onDragLeave={() => setOnDrag(false)}
                            data-ondrag={onDrag}
                        >
                            <svg viewBox="0 0 20 10">
                                <text x="4" y="8.5" fontSize="2">Upload Files</text>
                                <text x="7.5" y="6" fontSize="5" className="ms-o">note_add</text>
                            </svg>
                            <input
                                type="file"
                                onChange={selectFile}
                                multiple
                            />
                        </label>
                        : <div className="uploadFiles">
                            <h2>File List</h2>
                            <h5>Click to remove, drag to add files</h5>
                            <div className="toolBar">
                                <input
                                    className="search"
                                    type="text"
                                    value={search}
                                    onChange={event => setSearch(event.target.value)}
                                    placeholder="Search..."
                                />
                                <div className="buttons">
                                    <DropDownList
                                        options={["Private", "Public"]}
                                        onSelect={(n) => setIsPublic(n === 1)}
                                    />
                                    <button
                                        className="upload ani-btn"
                                        onClick={uploadFile}
                                    >Upload</button>
                                    <button
                                        className="cancel ani-btn"
                                        onClick={() => setSelectFiles([])}
                                    >Cancel</button>
                                </div>
                            </div>
                            <pre className="list">
                                <code>
                                    {selectFiles.filter(
                                        file => file.name.includes(search)
                                    ).map((file, i) => <span
                                        key={i}
                                        onClick={() => setSelectFiles(
                                            v => v.filter(f => f !== file)
                                        )}
                                    >{file.name}</span>)}
                                </code>
                            </pre>
                        </div>
                }
            </div>
        </div>
    );
};
