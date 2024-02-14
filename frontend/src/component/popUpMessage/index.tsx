import { CSSProperties, ReactElement } from "react";

import MessageBox from "schemas/messageBox";

import "./index.scss";

type propsType = Readonly<{
    messageList: Array<MessageBox>,
    timeout: number,
}>;

export default function PopUpMessage(props: propsType): ReactElement {
    const {
        messageList,
        timeout
    } = props;

    return (
        <div id="popUpMessage" style={{
            "--timeout": timeout
        } as CSSProperties}>
            {
                messageList.map(v => <div
                    key={`${v.context}${v.randomCode}`}
                    className="box"
                    data-level={v.level}
                >{v.context}</div>)
            }
        </div>
    );
};
