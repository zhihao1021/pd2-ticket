export default interface MessageBox {
    level: "INFO" | "WARN" | "ERROR",
    context: string,
    randomCode?: string,
};
