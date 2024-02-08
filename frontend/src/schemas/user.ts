export default interface UserData {
    id: number,
    username: string,
    global_name: string | null,
    avatar: string | null,
    is_admin: boolean,
    display_name: string,
    display_avatar: string,
};
