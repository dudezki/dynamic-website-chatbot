import { Controller, Post, Body, HttpException, HttpStatus, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

export class AuthDto {
  client_id: string;
  client_secret: string;
}

export class CreateClientDto {
  client_name: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  async authenticate(@Body() authDto: AuthDto) {
    try {
      const { client_id, client_secret } = authDto;
      
      if (!client_id || !client_secret) {
        throw new HttpException(
          'client_id and client_secret are required',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.authService.authenticate(client_id, client_secret);
      
      return {
        success: true,
        ...result,
        token_type: 'Bearer',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Authentication failed',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  @Post('client')
  async createClient(@Body() createClientDto: CreateClientDto) {
    try {
      const { client_name } = createClientDto;
      
      if (!client_name) {
        throw new HttpException(
          'client_name is required',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.authService.createClient(client_name);
      
      return {
        success: true,
        message: 'Client created successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to create client',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('create')
  async createClientByQuery(@Query('client_name') clientName: string) {
    try {
      if (!clientName) {
        throw new HttpException('client_name parameter is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.authService.createClient(clientName);
      
      return {
        success: true,
        message: 'Client created successfully',
        client_id: result.client_id,
        client_secret: result.client_secret,
        client_name: clientName,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating client:', error);
      throw new HttpException(
        'Failed to create client',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
