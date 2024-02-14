export default function UTCTimestamp2String(timestamp: number): string {
    const offset = (new Date()).getTimezoneOffset() * 60;
    timestamp -= offset;
    timestamp *= 1000;
    return (new Date(timestamp)).toLocaleString();
};
