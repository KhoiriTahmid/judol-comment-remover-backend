import { createParamDecorator, ExecutionContext, UnauthorizedException } from "@nestjs/common";

export const GetUser = createParamDecorator(
    ( ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        
        if (!request.user) {
          throw new UnauthorizedException("User not found in request");
        }
        
        return request.user;
      },
)