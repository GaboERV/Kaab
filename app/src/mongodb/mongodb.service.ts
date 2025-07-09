import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, type Db } from 'mongodb';

@Injectable()
export class MongoDbService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private database: Db;
  private readonly mongoUri: string;
  private readonly logger = new Logger(MongoDbService.name); // Create the logger

  constructor(private readonly configService: ConfigService) {
    // Inject ConfigService
    const uri = this.configService.get<string>('DATABASE_URL');
    if (!uri) {
      this.logger.error('DATABASE_URL is not defined in configuration'); // Use the logger
      throw new Error('DATABASE_URL is not defined in configuration');
    }
    this.mongoUri = uri; // Get URI from ConfigService
  }

  async onModuleInit() {
    if (!this.mongoUri) {
      this.logger.error('DATABASE_URL is not defined in configuration');
      throw new Error('DATABASE_URL is not defined in configuration');
    }

    // ADD THIS LINE (TEMPORARY LOGGING)
    this.logger.debug(`Connecting to MongoDB with URI: ${this.mongoUri}`);

    this.client = new MongoClient(this.mongoUri);

    try {
      await this.client.connect();
      const dbName = new URL(this.mongoUri).pathname.substring(1);
      this.database = this.client.db(dbName);
      this.logger.log('Connected to MongoDB successfully'); // Use the logger
    } catch (error) {
      this.logger.error('Error connecting to MongoDB:', error); // Use the logger
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('Disconnected from MongoDB'); // Use the logger
    }
  }

  getDatabase(): Db {
    if (!this.database) {
      this.logger.error('Database not initialized'); // Use the logger
      throw new Error('Database not initialized');
    }
    return this.database;
  }

  getCollection(name: string) {
    return this.getDatabase().collection(name);
  }
}
