import { ReactElement } from "react";

import "./index.scss";

export default function SmallLoading(props: any): ReactElement {
    return (
        <div className="smallLoading" {...props}>
            <svg viewBox="0 0 60 11">
                <text x="18" y="6" fontSize={5}>Loading...</text>
                <line x1="0" y1="10.5" x2="60" y2="10.5" />
            </svg>
        </div>
    );
};
