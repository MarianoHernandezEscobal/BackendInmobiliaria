import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { RentDTO } from '../dto/rent.dto';

@Injectable()
export class RentTransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value) {
      if (value.rent) {
        value.rent = plainToInstance(RentDTO, value.rent);
      }
    }
    return value;
  }
}
