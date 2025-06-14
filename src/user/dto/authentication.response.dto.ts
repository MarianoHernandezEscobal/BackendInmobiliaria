import { UserEntity } from '@src/database/user/user.entity';
import { UserResponseDto } from './user.response.dto';

export class AuthenticationResponseDto {
    user: UserResponseDto;
    token: string;

    constructor(access_token: string, user: UserEntity) {
        this.token = access_token;
        this.user = new UserResponseDto(user);
    }
}