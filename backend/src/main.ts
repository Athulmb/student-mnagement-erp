import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3001;
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

  // Middlewares
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin === frontendUrl
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('BMN Academy - Student Management Portal API')
    .setDescription('Production-ready RESTful API for BMN Academy Student & Admin Management')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'bearer',
    )
    .addTag('Authentication', 'Endpoints for registration, common login, refresh token, and logout')
    .addTag('Admin', 'Administrative controls for dashboards, approvals, students, and activities')
    .addTag('Student', 'Student dashboard, class schedule, and profile management')
    .addTag('Courses', 'Academic course catalog management')
    .addTag('Classes', 'Class batch schedules and enrollments')
    .addTag('Announcements', 'Academy-wide announcements and notifications')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'BMN Academy API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`====================================================`);
  logger.log(` BMN Academy Backend running at: http://localhost:${port}`);
  logger.log(` Swagger API Documentation at:    http://localhost:${port}/api/docs`);
  logger.log(` Configured Frontend URL:         ${frontendUrl}`);
  logger.log(`====================================================`);
}

bootstrap();
