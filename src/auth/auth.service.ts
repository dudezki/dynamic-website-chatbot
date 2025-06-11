import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../database/entities/client.entity';
import { ClientAccessToken } from '../database/entities/client-access-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(ClientAccessToken)
    private tokenRepository: Repository<ClientAccessToken>,
  ) {}

  async authenticate(clientId: string, clientSecret: string): Promise<{ access_token: string; expires_in: number }> {
    const client = await this.clientRepository.findOne({
      where: { client_id: clientId, is_active: true }
    });

    if (!client || client.client_secret !== clientSecret) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    // Deactivate existing tokens for this client
    await this.tokenRepository.update(
      { client_id: client.id, is_active: true },
      { is_active: false }
    );

    // Generate new token
    const token = this.generateToken();
    const expiresIn = 3600; // 1 hour
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    const accessToken = this.tokenRepository.create({
      token,
      client_id: client.id,
      expires_at: expiresAt,
      is_active: true,
    });

    await this.tokenRepository.save(accessToken);

    return {
      access_token: token,
      expires_in: expiresIn,
    };
  }

  async validateToken(token: string): Promise<Client | null> {
    const accessToken = await this.tokenRepository.findOne({
      where: { token, is_active: true },
      relations: ['client'],
    });

    if (!accessToken || accessToken.expires_at < new Date()) {
      return null;
    }

    return accessToken.client;
  }

  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createClient(clientName: string): Promise<{ client_id: string; client_secret: string }> {
    const clientId = crypto.randomUUID();
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const client = this.clientRepository.create({
      client_id: clientId,
      client_secret: clientSecret,
      client_name: clientName,
      is_active: true,
    });

    await this.clientRepository.save(client);

    return { client_id: clientId, client_secret: clientSecret };
  }
}
