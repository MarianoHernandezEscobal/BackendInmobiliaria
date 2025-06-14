import { Request } from 'express';
import { UserResponseDto } from '../dto/user.response.dto';

export interface RequestWithUser extends Request {
  user: UserResponseDto;
}