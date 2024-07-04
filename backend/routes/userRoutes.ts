import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from "hono/jwt";
import { signupInput } from "@100xdevs/medium-common";


export const app=new Hono<{
    Bindings:{
      DATABASE_POOL_URL:string,
      JWT_SECRET:string
    }
  }>();

app.post("/signup",async(c)=>{

 const body=await c.req.json();

 const success=signupInput.safeParse(body);

 if(!success){
   c.status(400);
   return c.json({err:"check again"});
 }

 const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_POOL_URL
 }).$extends(withAccelerate());

 async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

 try{
  
  const hashedPassword= await hashPassword(body.password);
  
 const newUser=await prisma.user.create({
    data:{
        username:body.username,
        email:body.email,
        password:hashedPassword,
    },
    select:{
      username:true,
      email:true,
      password:false,
      id:true
    }
 })
 const token=await sign({id:newUser.id},c.env.JWT_SECRET)
  return c.json(token)
}
catch(err){
  console.log(err);
  c.status(411);
  return c.text("internal server error")
 }

})

app.post("/signin",async(c)=>{


  const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_POOL_URL
  }).$extends(withAccelerate());


  async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
  


 
   try{
    const {username,password}= await c.req.json();
    
    const user=await prisma.user.findUnique({
      where:{
        username:username
      },
    })

    if(!user){
      return c.json({error:"user not found"});
    }

    const hashedPassword=await hashPassword(password);

   if(hashedPassword==user.password){
         
     const token=await sign({id:user.id},c.env.JWT_SECRET);
    return c.json({jwt:token})

   }else{
    return c.json({error:"password is wrong"})
   }
    
   }catch(err){
    console.log(err);
    c.status(500);
   return  c.json({err:"internal server error"})
   }

})

// //   const prisma = new PrismaClient({
//     datasourceUrl: c.env("DATABASE_URL"),
// }).$extends(withAccelerate());