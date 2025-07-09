import { SetMetadata } from "@nestjs/common"
import type { Role } from "../../types/user.types"

export const Roles = (...roles: Role[]) => SetMetadata("roles", roles)
