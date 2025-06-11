import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiService } from './gemini.service';

@Controller('gemini')
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Get('prompt')
  async processPrompt(@Query('prompt') prompt: string) {
    try {
      if (!prompt) {
        throw new HttpException('Prompt parameter is required', HttpStatus.BAD_REQUEST);
      }

      const response = await this.geminiService.generateResponse(prompt);
      
      return {
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in GeminiController:', error);
      throw new HttpException(
        'Failed to process prompt',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
