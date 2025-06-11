import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('migrate')
  async migrateTables() {
    try {
      const result = await this.databaseService.migrateClientTables();
      
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error in database migration:', error);
      throw new HttpException(
        'Failed to migrate tables',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  async checkDatabaseStatus() {
    try {
      const tablesExist = await this.databaseService.checkTablesExist();
      
      return {
        success: true,
        message: 'Database status checked',
        tables: tablesExist,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error checking database status:', error);
      throw new HttpException(
        'Failed to check database status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
