import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async migrateClientTables(): Promise<{ success: boolean; message: string; tables: string[] }> {
    try {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();

      // Check if running on SQLite or PostgreSQL
      const dbType = this.dataSource.options.type;
      const createdTables: string[] = [];

      if (dbType === 'sqlite') {
        // SQLite table creation
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "clients" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "client_id" TEXT NOT NULL UNIQUE,
            "client_secret" TEXT NOT NULL,
            "client_name" TEXT NOT NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT 1,
            "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "client_access_tokens" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "token" TEXT NOT NULL,
            "client_id" INTEGER NOT NULL,
            "expires_at" DATETIME NOT NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT 1,
            "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("client_id") REFERENCES "clients"("id")
          )
        `);
      } else {
        // PostgreSQL table creation
        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "clients" (
            "id" SERIAL PRIMARY KEY,
            "client_id" VARCHAR NOT NULL UNIQUE,
            "client_secret" VARCHAR NOT NULL,
            "client_name" VARCHAR NOT NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);

        await queryRunner.query(`
          CREATE TABLE IF NOT EXISTS "client_access_tokens" (
            "id" SERIAL PRIMARY KEY,
            "token" VARCHAR NOT NULL,
            "client_id" INTEGER NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "is_active" BOOLEAN NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT "FK_client_access_tokens_client_id" 
            FOREIGN KEY ("client_id") REFERENCES "clients"("id")
          )
        `);
      }

      createdTables.push('clients', 'client_access_tokens');
      await queryRunner.release();

      return {
        success: true,
        message: `Tables migrated successfully using ${dbType}`,
        tables: createdTables,
      };
    } catch (error) {
      console.error('Migration error:', error);
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        tables: [],
      };
    }
  }

  async checkTablesExist(): Promise<{ clients: boolean; client_access_tokens: boolean }> {
    try {
      const dbType = this.dataSource.options.type;
      
      if (dbType === 'sqlite') {
        const clientsTable = await this.dataSource.query(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='clients'
        `);
        
        const tokensTable = await this.dataSource.query(`
          SELECT name FROM sqlite_master WHERE type='table' AND name='client_access_tokens'
        `);

        return {
          clients: clientsTable.length > 0,
          client_access_tokens: tokensTable.length > 0,
        };
      } else {
        const clientsTable = await this.dataSource.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'clients'
        `);
        
        const tokensTable = await this.dataSource.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'client_access_tokens'
        `);

        return {
          clients: clientsTable.length > 0,
          client_access_tokens: tokensTable.length > 0,
        };
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      return {
        clients: false,
        client_access_tokens: false,
      };
    }
  }
}