import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'


export const app=new Hono<{
    Bindings:{
      DATABASE_POOL_URL:string,
      JWT_SECRET:string
    },
    Variables:{
      userId:string
    }
  }>();


app.post("/",async(c)=>{
   const userId=c.var.userId;
   const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_POOL_URL
   }).$extends(withAccelerate());

  const user=await prisma.user.findFirst({
    where:{
      id:userId
    }
  })

 try{ 
  const body=await c.req.json();
  const newPost=await prisma.post.create({
    data:{
        title:body.title,
        content:body.content,
        authorId:userId
    }
  })

  return c.json({id:newPost.id});


}catch(err){
    console.log(err)
    c.status(500);
    return c.json({err:"internal server error"})
  }
})

app.put("/",async(c)=>{
   const userId=c.get("userId");

   const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_POOL_URL
   }).$extends(withAccelerate());

   const body=await c.req.json();

   await prisma.post.update({
    where:{
        id:body.id,
        authorId:userId
    },
    data:{
        title:body.title,
        content:body.content
    }
   })


})

// always remember when we have 2 endpoints having same path and one is requireing some params always put
// the more specific route first and then the route with params
// if not then u we will error as in below if bulk is below id i will get user id: bulk as output instead of bulk output


app.get("/bulk",async(c)=>{


    try {

    const prisma=new PrismaClient({
        datasourceUrl:c.env.DATABASE_POOL_URL
    }).$extends(withAccelerate())

    const data=await prisma.post.findMany({});
    return c.json(data)

    } catch (err) {
        console.log(err)
        c.status(500)
        return c.json({err:"internal server error"})
    }
})

app.get("/:userId",async(c)=>{
    const userId=c.req.param('userId');

  try{

  const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_POOL_URL
  }).$extends(withAccelerate());

  const posts=await prisma.post.findMany({
    where:{
        authorId:userId
    }
  })
  c.status(200);
  return c.json(posts);

  }
  catch (err) {
    console.log(err)
    c.status(500)
    return c.json({err:"internal server error"})
}
})

app.get("/post/:id",async(c)=>{
    const postId=c.req.param('id');

  try{

  const prisma=new PrismaClient({
    datasourceUrl:c.env.DATABASE_POOL_URL
  }).$extends(withAccelerate());

  const posts=await prisma.post.findMany({
    where:{
        id:postId
    }
  })
  c.status(200);
  return c.json(posts);

  }
  catch (err) {
    console.log(err)
    c.status(500)
    return c.json({err:"internal server error"})
}
})


