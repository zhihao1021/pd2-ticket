import {
    ReactElement
} from "react";
import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import ListPgae from "./list";
import ContentPage from "./content";

export default function TicketPage(): ReactElement {
    return (
        <Routes>
            <Route path="/:userId?" element={<ListPgae />} />
            <Route path="/:userId/:ticketId/:filename?" element={<ContentPage />} />
            <Route path="*" element={<Navigate to="." />} />
        </Routes>
    );
};
