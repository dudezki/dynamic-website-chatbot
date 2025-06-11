import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from './entities/client.entity';
import { ClientAccessToken } from './entities/client-access-token.entity';
import { DatabaseService } from './database.service';
import { DatabaseController } from './database.controller';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE') || 'postgres';

        if (dbType === 'sqlite') {
          // Use SQLite for local development
          return {
            type: 'sqlite',
            database: configService.get('DB_DATABASE') || './data/database.sqlite',
            entities: [Client, ClientAccessToken],
            synchronize: true,
            logging: true,
          };
        } else {
          // Use Supabase PostgreSQL (default)
          const databaseUrl = configService.get('DATABASE_URL');

          if (databaseUrl) {
            // Use connection string
            return {
              type: 'postgres',
              url: databaseUrl,
              entities: [Client, ClientAccessToken],
              synchronize: configService.get('NODE_ENV') !== 'production',
              ssl: { rejectUnauthorized: false },
              logging: configService.get('NODE_ENV') === 'development',
            };
          } else {
            // Use individual connection parameters
            return {
              type: 'postgres',
              host: configService.get('SUPABASE_DB_HOST'),
              port: +configService.get('SUPABASE_DB_PORT') || 5432,
              username: configService.get('SUPABASE_DB_USERNAME'),
              password: configService.get('SUPABASE_DB_PASSWORD'),
              database: configService.get('SUPABASE_DB_NAME'),
              entities: [Client, ClientAccessToken],
              synchronize: configService.get('NODE_ENV') !== 'production',
              ssl:
                configService.get('SUPABASE_DB_SSL') === 'true'
                  ? { rejectUnauthorized: false }
                  : false,
              logging: configService.get('NODE_ENV') === 'development',
            };
          }
        }
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
