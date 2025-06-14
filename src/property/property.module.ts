import { Module } from '@nestjs/common';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';
import { DatabaseModule } from '@src/database/database.module';
import { ClientsModule } from '@src/clients/clients.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '@user/user.module';
import { S3Module } from '@src/s3/s3.module';
import { FastifyMulterModule } from '@nest-lab/fastify-multer';

@Module({
  imports: [
    FastifyMulterModule,
    DatabaseModule,
    ClientsModule,
    UserModule,
    S3Module,
    ScheduleModule.forRoot(),
  ],
  controllers: [PropertyController],
  providers: [PropertyService],
})
export class PropertyModule {}