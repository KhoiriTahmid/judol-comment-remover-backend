import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { Cookies } from "./type.ts";

@Injectable()
export class Auth implements CanActivate{

    canActivate(context: ExecutionContext): boolean {

      const req = context.switchToHttp().getRequest<Request&{user:Cookies}>()
      const rawCookie = req.headers.cookie;
      if (!rawCookie) throw new UnauthorizedException();
      const cookies_arr = rawCookie.split("; ")

      const cookies: Partial<Record<keyof Cookies, string>> = {}
      cookies_arr.forEach(e=>{          
          const [key, value] = e.split("=");
          cookies[key as keyof Cookies]=decodeURIComponent(value)
      })

      const user: Cookies = {
        "access-token":cookies["access-token"]!,
        "refresh-token":cookies["refresh-token"]!,
        "user-info":JSON.parse(cookies["user-info"]!),

      }
      if(Object.values(user).includes(undefined)) throw new UnauthorizedException()
      
      req.user = user;
      return true
    }
}


