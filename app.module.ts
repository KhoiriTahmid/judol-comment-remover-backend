import { Module } from '@nestjs/common';
import { AppController } from "./app.controller.ts";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}