import axios from "axios";

import UserData from "schemas/user";

async function getUserInfo(userId: string): Promise<UserData> {
    const response = await axios.get(
        `/user/${userId}`
    );

    return response.data;
}

export { getUserInfo };
