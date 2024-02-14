import { jwtDecode } from "jwt-decode";
import {
  ReactElement,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import User from "schemas/user";

import dataContext from "context/data";
import functionContext from "context/function";

import Loading from "component/loading";
import SideBar from "component/sideBar";
import PopUpMessage from "component/popUpMessage";

import LoginPage from "views/login";
import TicketPage from "views/ticket";
import CreatePage from "views/create";

import MessageBox from "schemas/messageBox";

import { setDealError } from "config/axios";

import "./App.scss";

const messageBoxTimeout = 7;


export default function App(): ReactElement {
  const [loading, setLoading] = useState<boolean>(false);
  const [messageList, setMessageList] = useState<Array<MessageBox>>([]);
  const [lastPath, setLastPath] = useState<string>("");

  const location = useLocation();

  const token = localStorage.getItem("access_token");
  const userData = useMemo(() => {
    if (token === null) return undefined;
    try { return jwtDecode<User>(token); }
    catch { return undefined; }
  }, [token]);

  useEffect(() => {
    if (lastPath !== "") return;
    if (location.pathname !== "/login") {
      localStorage.setItem("lastPath", location.pathname);
    }
    setLastPath(localStorage.getItem("lastPath") || "/ticket");
  }, [location.pathname, lastPath]);

  // Record last access path
  useEffect(() => {
    if (location.pathname === "/login") return;
    localStorage.setItem("lastPath", location.pathname);
  }, [location.pathname]);

  // Add message to queue
  const addMessageBox = useCallback((data: MessageBox) => {
    setMessageList(v => {
      let nv = Array.from(v);
      data.randomCode = (Math.random() * 10000).toString();
      nv.push(data);
      return nv;
    });
    setTimeout(
      () => setMessageList(v => v.slice(1)),
      messageBoxTimeout * 1000
    );
  }, [setMessageList]);

  // Dealing with axios error
  useEffect(() => {
    if (!addMessageBox) return;
    setDealError((error) => {
      const response = error.response;
      if (response === undefined || response.status === undefined) {
        addMessageBox({
          level: "ERROR",
          context: "Server is down, please contact admin."
        })
      }
      throw error;
    })
  }, [addMessageBox]);

  return (
    <div id="app" data-theme="dark">
      <functionContext.Provider value={{
        setLoading: setLoading,
        addMessageBox: addMessageBox,
      }}>
        <dataContext.Provider value={{
          userData: userData
        }}>
          <Loading show={loading} />
          <SideBar />
          <PopUpMessage messageList={messageList} timeout={messageBoxTimeout} />
          {
            userData === undefined ? <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes> : <Routes>
              <Route path="ticket/*" element={<TicketPage />} />
              <Route path="create" element={<CreatePage />} />
              <Route path="last" element={<Navigate to={lastPath} />} />
              <Route path="" element={<Navigate to="/ticket" />} />
              <Route path="*" element={<Navigate to="" />} />
            </Routes>
          }
        </dataContext.Provider>
      </functionContext.Provider>
    </div>
  );
};
