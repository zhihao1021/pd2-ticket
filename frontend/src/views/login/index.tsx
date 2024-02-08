import axios, { AxiosError } from "axios";
import {
    ReactElement,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useSearchParams
} from "react-router-dom";

import FastAPIError from "../../schemas/error";
import JWT from "../../schemas/oauth";

import functionContext from "../../context/function";

import "./index.scss";

export default function LoginPage(): ReactElement {
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    const [searchParams, setSearchParams] = useSearchParams();
    const setNavigate = useNavigate();

    const { setLoading } = useContext(functionContext);

    useEffect(() => {
        // Check if redirected from discord oauth page
        const code = searchParams.get("code");
        // If not, return
        if (code === null) return;

        // Clear error message
        setErrorMessage(undefined);
        // Clear search params
        searchParams.delete("code");
        setSearchParams(searchParams);

        // Open loading page
        if (setLoading) setLoading(true);

        // OAuth
        axios.post("/oauth", {
            "code": code,
        }).then((response) => {
            // Authorize success, save token and redirect to root
            const data: JWT = response.data;
            window.localStorage.setItem("access_token", data.access_token);
            window.localStorage.setItem("token_type", data.token_type);

            setNavigate("/")
        }).catch((error: AxiosError) => {
            // Authorize failed, show error message
            if (error.response) {
                const data: FastAPIError = error.response.data as FastAPIError;
                setErrorMessage(`Login Failed: ${error.response.status} ${data.detail}`)
            }
            else setErrorMessage(`Login Failed: Server no response`)
        }).finally(() => {
            // Close loading page
            if (setLoading) setLoading(false);
        });
    }, [searchParams, setSearchParams, setNavigate, setLoading]);


    return (
        <div id="loginPage" className="page">
            <div className="box">
                <h1>Login</h1>
                <a className="ani-btn" href={process.env.REACT_APP_OAUTH_URL}>
                    <img alt="login button" src={`${process.env.PUBLIC_URL}/img/discord-logo-white.svg`} />
                </a>
                {
                    errorMessage === undefined ? undefined :
                        <div className="errorBox">
                            {errorMessage}
                        </div>
                }
            </div>
        </div>
    );
};
