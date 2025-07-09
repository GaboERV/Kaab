import { Injectable } from "@nestjs/common"
import { PassportStrategy } from "@nestjs/passport"
import { ExtractJwt, Strategy } from "passport-jwt"
import { JwtPayload } from "../interfaces/jwt-payload.interface"
import { ConfigService } from "@nestjs/config"
import { UsersService } from "../../users/users.service"

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const jwtSecret = configService.get<string>("JWT_SECRET")
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in environment variables")
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.userId)

    if (!user) {
      return null
    }

    return {
      _id: user._id,
      email: user.email,
      role: user.role,
    }
  }
}
