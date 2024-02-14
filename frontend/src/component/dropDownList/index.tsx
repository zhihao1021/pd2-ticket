import {
    CSSProperties,
    ReactElement,
    useEffect,
    useState,
} from "react";

import "./index.scss";

type propsType = Readonly<{
    options: Array<string>,
    value?: number,
    onSelect?: (option: number) => void,
    displayRow?: number,
}>;

export default function DropDownList(props: propsType): ReactElement {
    const {
        options,
        value,
        onSelect,
        displayRow,
    } = props;

    const [open, setOpen] = useState<boolean>(false);
    const [select, setSelect] = useState<number>(0);

    useEffect(() => {
        if (value === undefined) return;
        setSelect(value)
    }, [value]);

    return (
        <div className="dropDownList" data-open={open} style={{
            "--rows": options.length,
            "--display-rows": displayRow || options.length,
            "--width": Math.max(...options.map(v => v.length), 0)
        } as CSSProperties}>
            <div className="container">
                <div className="selected" onClick={() => setOpen(v => !v)}>
                    <div className="context">{options[select]}</div>
                    <div className="ms-o">expand_more</div>
                </div>
                <div className="content">
                    {options.map((v, i) => <div
                        key={i}
                        className="value"
                        onClick={() => {
                            if (value === undefined) setSelect(i);
                            if (onSelect) onSelect(i);
                            setOpen(false);
                        }}
                    >{v}</div>)}
                </div>
            </div>
        </div>
    );
};
