import { Hono } from 'hono'
import {app as userApp} from '../routes/userRoutes';
import { app as blogApp } from '../routes/blogRoutes';
import { verify } from 'hono/jwt';


const app = new Hono<{
	Bindings: {
		DATABASE_URL: string,
		JWT_SECRET: string,
	},
	Variables : {
		userId: string
	}
}>().basePath("/api/v1");

type middleware={
  Bindings:{
    DATABASE_POOL_URL:string
  }
}


app.use("/blog/*",async(c,next)=>{
  const jwt=c.req.header("Authorization");

if (!jwt) {
  console.log(jwt);
        c.status(401);
        return c.json({ error: "jwt not recieved" });
    }

 const payload=await verify(jwt,c.env.JWT_SECRET);
 const userId=String(payload.id);
 if (!payload) {
  c.status(401);
  return c.json({ error: "unauthorized" });
}

c.set("userId",userId)
 await next();
})


app.route("/user",userApp);
app.route("/blog",blogApp);

export default app;
