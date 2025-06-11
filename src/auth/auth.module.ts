import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Client } from '../database/entities/client.entity';
import { ClientAccessToken } from '../database/entities/client-access-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientAccessToken])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
