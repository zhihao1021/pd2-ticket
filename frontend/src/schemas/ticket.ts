export default interface TicketData {
    ticket_id: string,
    author_id: string,
    create_utc_timestamp: number,
    files: Array<string>,
    public: boolean,
};

export interface TicketUpdate {
    public?: boolean
};
