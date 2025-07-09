import { Module } from "@nestjs/common"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { JwtModule } from "@nestjs/jwt"
import { JwtStrategy } from "./strategies/jwt.strategies"
import { ConfigModule } from "@nestjs/config"
import { MongoDbModule } from "../mongodb/mongodb.module"
import { UsersModule } from "../users/users.module"

@Module({
  imports: [
    JwtModule.register({
      global: true,
    }),
    ConfigModule,
    MongoDbModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
