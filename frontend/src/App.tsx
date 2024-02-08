import { jwtDecode } from "jwt-decode";
import {
  ReactElement,
  useEffect,
  useState,
} from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";

import User from "./schemas/user";

import dataContext from "./context/data";
import functionContext from "./context/function";

import Loading from "./component/loading";
import SideBar from "./component/sideBar";

import LoginPage from "./views/login";

import "./App.scss";


export default function App(): ReactElement {
  const [userData, setUserData] = useState<User | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const location = useLocation();
  const setNavigate = useNavigate();


  // Refresh Token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    // Check if token is legal
    if (token !== null) {
      try {
        setUserData(jwtDecode<User>(token));
        return
      } catch {}
    }
    // Token is illegal
    // Remove user data
    setUserData(undefined);
    // If not in login page, redirect to it
    if (location.pathname !== "/login") {
      setNavigate("/login");
    }
  }, [location.pathname, setNavigate]);

  return (
    <div id="app" data-theme="dark">
      <functionContext.Provider value={{
        setLoading: setLoading
      }}>
        <dataContext.Provider value={{
          userData: userData
        }}>
          <Loading show={loading} />
          <SideBar />
          <Routes>
            <Route path="/" element={<div></div>} />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </dataContext.Provider>
      </functionContext.Provider>
    </div>
  );
};
