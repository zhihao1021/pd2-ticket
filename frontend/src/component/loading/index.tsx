import {
    CSSProperties,
    ReactElement,
    useEffect,
    useState,
} from "react";

import "./index.scss";

type propsType = Readonly<{
    show: boolean
}>;

export default function Loading(props: propsType): ReactElement {
    const { show } = props;
    const [loadingDot, setLoadingDot] = useState<number>(1);

    useEffect(() => {
        setTimeout(() => {
            setLoadingDot(v => v % 5 + 1)
        }, 800);
    }, [loadingDot]);

    return (
        <div id="loading" data-show={show}>
            <div className="box">
                <h3>{`Loading${".".repeat(loadingDot)}`}</h3>
                {
                    Array.from(Array(12)).map((_,i) => <div
                        key={i}
                        className="dot"
                        style={{
                            "--key": i,
                            "--top": (Math.cos(Math.PI * i / 6) - 1) * -0.5,
                            "--left": (Math.sin(Math.PI * i / 6) + 1) * 0.5,
                        } as CSSProperties}
                    />)
                }
            </div>
        </div>
    );
};
