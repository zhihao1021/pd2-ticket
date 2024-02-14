import { ReactElement } from "react";

import "./index.scss";

export default function NotFound(): ReactElement {
    return (
        <div className="notFound">
            <svg viewBox="0 0 60 30">
                <text x="4" y="20" fontSize="20">≥o≤</text>
                <text x="3.25" y="28" fontSize="5">Nothing found here......</text>
            </svg>
        </div>
    );
};
