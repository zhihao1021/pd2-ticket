import axios from "axios";
import {
    ReactElement,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    Link,
    useNavigate,
    useLocation,
} from "react-router-dom";

import dataContext from "context/data";

import "./index.scss";

const navigate = {
    "/home": "首頁\nHome",
    "/ticket": "Ticket 列表\nTicket List",
    "/create": "新增 Ticket\nCreate Ticket",
};

export default function SideBar(): ReactElement | null {
    const { userData } = useContext(dataContext);
    
    const [version, setVersion] = useState<string>("v0.0.0");

    // Sidebar state, read default from localStorage
    const [open, setOpen] = useState<boolean>(
        localStorage.getItem("sideBar") !== "false"
    );

    const setNavigate = useNavigate();
    const location = useLocation();

    // Get API version
    useEffect(() => {
        axios.get("/version").then((response) => {
            setVersion(`v${response.data}`);
        }).catch(() => {
            setVersion("API down")
        })
    }, []);

    // Save sidebar state to localStorage
    useEffect(() => localStorage.setItem(
        "sideBar",
        open ? "true" : "false"
    ), [open]);

    return location.pathname === "/login" ? null : (
        <div id="sideBar" data-open={open}>
            {/* Switch Button */}
            <button className="switchButton" onClick={() => setOpen(v => !v)} />

            <div className="content">
                {/* User Info */}
                <div className="userInfo">
                    <img alt="avatar" src={userData?.display_avatar} />
                    <div className="text">
                        <div className="welcome">Welcome</div>
                        <div className="username">{userData?.display_name}</div>
                    </div>
                </div>

                {/* Link List */}
                {
                    Object.entries(navigate).map(([link, name], i) => <Link
                        key={i}
                        to={link}
                        className="link"
                        data-select={location.pathname === link || location.pathname === `${link}/`}
                        onClick={() => setOpen(false)}
                    >{name}</Link>)
                }

                {/* Version Info */}
                <div className="versionInfo">
                    <div>
                        <div className="name">Core Version:</div>
                        <div className="version">{version}</div>
                    </div>
                    <div>
                        <div className="name">UI Version:</div>
                        <div className="version">{`v${process.env.REACT_APP_VERSION}`}</div>
                    </div>
                    <div>
                        <div className="name">GitHub:</div>
                        <a
                            className="version"
                            href="https://github.com/zhihao1021/pd2-ticket"
                            target="_blank"
                            rel="noreferrer"
                        >Link</a>
                    </div>
                </div>

                {/* Logout Button */}
                <button className="logoutButton" onClick={() => {
                    localStorage.clear();
                    setNavigate("/login");
                }}>
                    <span>Logout</span>
                    <span className="ms-o">logout</span>
                </button>
            </div>
        </div>
    );
};
