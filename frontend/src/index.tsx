import axios, { AxiosError } from "axios";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter
} from "react-router-dom";

import JWT from "./schemas/oauth";

import App from "./App";

import "./index.scss";

declare module "react" {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?: string;
    mozdirectory?: string;
  }
};

axios.interceptors.request.use(async (config) => {
  config.baseURL = process.env.REACT_APP_API_END_POINT;

  let token = localStorage.getItem("access_token");
  let tokenType = localStorage.getItem("token_type");
  // 如果JWT存在，則放入Header
  if (token !== null && tokenType !== null) {
    config.headers.Authorization = `${tokenType} ${token}`;
  }
  return config;
});

axios.put("/oauth").then((response) => {
  const data: JWT = response.data;
  window.localStorage.setItem("access_token", data.access_token);
  window.localStorage.setItem("token_type", data.token_type);
}).catch((error: AxiosError) => {
  if (error.response?.status === 403) {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("token_type");
  }
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
