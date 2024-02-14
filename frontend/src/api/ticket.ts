import axios from "axios";
// import { set, get, del, createStore } from "idb-keyval";

import TicketData, { TicketUpdate } from "schemas/ticket";

// const ticketConfigDB = createStore("ticketConfig", "keyval");

async function getTicketList(userId?: string | undefined): Promise<Array<string>> {
    const response = await axios.get(
        `/ticket/${userId || "@me"}`
    );

    return response.data;
}

async function uploadTicket(files: Array<File>, isPublic?: boolean | undefined): Promise<string> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file === null) continue
        formData.append("files", file);
    }
    formData.set("public", `${isPublic || false}`);

    const response = await axios.postForm(
        "/ticket",
        formData,
    );

    return response.data;
}

async function modifyTicket(ticketId: string, update: TicketUpdate): Promise<TicketData> {
    const response = await axios.put(
        `/ticket?ticket_id=${ticketId}`,
        update
    );

    return response.data;
}

async function deleteTicket(ticketId: string): Promise<undefined> {
    const response = await axios.delete(
        `/ticket?ticket_id=${ticketId}`
    );

    if (response.status !== 204) {
        throw Error;
    }

    return;
}

async function getTicketInfo(
    ticketId: string,
    userId?: string | undefined
): Promise<TicketData> {
    const response = await axios.get(
        `/ticket/${userId || "@me"}/${ticketId}`
    );

    const data: TicketData = response.data;

    return data;
}

async function getTicketFileContent(
    ticketId: string,
    filename: string,
    userId?: string | undefined
): Promise<string> {
    const response = await axios.get(
        `/ticket/${userId || "@me"}/${ticketId}/file?filename=${filename}`
    )

    return response.data;
}

async function downloadTicketZip(
    ticketId: string,
    userId?: string | undefined,
): Promise<Blob> {
    const response = await axios.get(
        `/ticket/${userId || "@me"}/${ticketId}/download`,
        {
            headers: {
                "Content-Type": "application/json; application/octet-stream"
            },
            responseType: "blob"
        }
    );

    return new Blob(
        [response.data],
        { type: "application/zip" }
    );
}

export {
    getTicketList,
    uploadTicket,
    modifyTicket,
    deleteTicket,
    getTicketInfo,
    getTicketFileContent,
    downloadTicketZip,
};
