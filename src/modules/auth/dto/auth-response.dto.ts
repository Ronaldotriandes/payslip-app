export class AuthResponseDto {
    access_token: string;
    user: {
        id: string;
        username: string
        fullname: string;
        role: string;
    };
}