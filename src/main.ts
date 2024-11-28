import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { injectSpeedInsights } from '@vercel/speed-insights';

injectSpeedInsights();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  return app;
}
export default bootstrap();
