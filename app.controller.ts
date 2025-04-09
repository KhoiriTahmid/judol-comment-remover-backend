import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { google } from "googleapis";
import { GetUser } from "./helper.ts"
import { Auth } from "./auth.ts";
import { Cookies } from "./type.ts";


@Controller('/')
export class AppController{

    private oauth2Client = new google.auth.OAuth2( 
        Deno.env.get("CLIENT_ID"),
        Deno.env.get("CLIENT_SECRET"),
        "http://localhost:3000/callback" 
    );


    @Get()
    login(@Res() res:Response){

        const URL = this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                "https://www.googleapis.com/auth/youtube.force-ssl",
                "openid",
                "email",
                "profile",
            ]
        });
        res.redirect(URL);
    }

    @Get('/callback')
    async callback(
        @Query('code') code:string,
        @Res() res: Response
    ){
        try {
            const { tokens } = await this.oauth2Client.getToken(code)
            res.cookie("access-token", tokens.access_token!,{httpOnly:true, secure:false, sameSite:'lax'})
            res.cookie("refresh-token", tokens.refresh_token!,{httpOnly:true, secure:false, sameSite:'lax'})
            
            
            const ticket = await this.oauth2Client.verifyIdToken({
                idToken: tokens.id_token!,
                audience: Deno.env.get("clientId"),
            });
            
            const payload = ticket.getPayload(); 
            const value = {
                email:decodeURI(payload?.email!),
                name:decodeURI(payload?.name!),
                picture:decodeURI(payload?.picture!)
            }
            res.cookie("user-info", JSON.stringify(value),{httpOnly:true, secure:false, sameSite:'lax'})

            return res.redirect("http://localhost:3000/dashboard") //red to react, fill id of video then req to @Get("/comments/:id")
        } catch (error) {
            throw error
        }
    }

    // @Get("dashboard")
    //  fo(
    //     @Req() req: Request,
    //  ){
    //     const cookies_arr = decodeURI(req.headers.cookie!).split("; ")
    //     const cookies:any = {}
    //     cookies_arr.forEach(e=>{
            
    //         const dum = e.split("=");
    //         cookies[dum[0]]=decodeURIComponent(dum[1])
    //     })
    //     console.info(cookies)
    //     cookies["user-info"] = JSON.parse(cookies["user-info"])
        
    //     return cookies;
    // }

    @UseGuards(Auth)
    @Get("/comments/:id")
    async comments(
        @Param('id') videoId: string,
    ){
        try {
            const youtube = google.youtube({
                version: 'v3',
                auth: "AIzaSyDj2Z4_gtfmiRqAVVCVJDdfRZsRrgtxoRk",
            });
        
            const response = await youtube.commentThreads.list({
                videoId, 
                textFormat: 'plainText',
                maxResults: 2, 
                part:["snippet"],
                fields:"items(snippet/topLevelComment(id,snippet/textDisplay))",
                order:"relevance"
            });

            return response;
        } catch (error) {
            throw error;
        }
    }

    @UseGuards(Auth)
    @Post("/hideComment")
    async commentHide(
        @Body() ids:string[],
        @GetUser() user:Cookies
    ){
        console.info(user)
        try {
            this.oauth2Client.setCredentials({
                access_token:user["access-token"],
                refresh_token:user["refresh-token"]
            })
    
            const youtube = google.youtube({
                version: 'v3',
                auth: this.oauth2Client,
            });
    
            const response = await youtube.comments.setModerationStatus({
                id:ids,
                moderationStatus:"rejected"
            })
    
            return response;
        } catch (error) {
            throw error;
        }
    }
}
