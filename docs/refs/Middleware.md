---
id: middleware
title: Middleware
---

Plumier middleware works exactly like Koa middleware, it executed in a stack-like order and has full control of the next middleware. 

The different between Plumier middleware and Koa middleware is Plumier middleware is a stateless class which has a method that act like pure function. It doesn't mutate things but returns value. With this behavior Plumier middleware relatively easy to unit test in isolation.

## Signature
Plumier middleware can be a function match `CustomMiddlewareFunction` signature or a class that implements `CustomMiddleware` interface. The signature is like below:

```typescript 
type CustomMiddlewareFunction = (next: Readonly<Invocation>) => Promise<ActionResult>

interface CustomMiddleware {
    execute(next: Readonly<Invocation>): Promise<ActionResult>
}

interface Invocation {
    context: Readonly<Context>
    proceed(): Promise<ActionResult>
}
```

Middleware has one parameter `next` which is an instance of `Invocation` object to proceed the next middleware. 
Middleware must return a promised `ActionResult`, you can return result of the invocation which mean its return 
result of previous middleware (its possibly the result of the action if the next middlewares doesn't modify the result). 
You can also return modified version of action result or a brand new action result. You can also throw an error from 
inside of middleware, the default error handler will handle it properly.

## Develop Your Own Middleware
To create a plumier middleware is as easy as Koa middleware, The idea is the same but simpler. The most basic middleware that does nothing is like below:

```typescript
class BasicMiddleware implements CustomMiddleware {
    execute(next: Readonly<Invocation>): Promise<ActionResult> {
        return next.proceed()
    }
}
```

Middleware above only execute the next middleware and pass its result into previous middleware. 

More real world example is creating a error handler middleware, For example we need to log all internal error 500
into database for auditing process.

```typescript
class BasicMiddleware implements CustomMiddleware {
    async execute(next: Readonly<Invocation>): Promise<ActionResult> {
        try{
            return await next.proceed()
        }
        catch (e){
            if(e instance of HttpStatusError && e.status === 500){
                //save error to db
            }
            //just re-throw it and let default error handler handle it
            throw e
        }
    }
}
```

## Interception 
Middleware has full control of the next middleware, with this behavior we can do interception easily. 
There are 3 types of interception: before, after and around.

### Intercept Before 
Interception occurs before the next execution proceeded. For example the authorization middleware, 
where the interception occur before proceeded. 

```typescript
import { Middleware, Invocation, ActionResult, HttpStatusError } from "plumier"

class AdminOnlyMiddleware implements CustomMiddleware {
    execute(next: Readonly<Invocation>): Promise<ActionResult> {
        if(next.ctx.state.user.role !== "Admin")
            throw new HttpStatusError(401)
        else
            return next.proceed()
    }
}
```

Above code showing that we intercept the process before proceeding to next middleware. If the user role 
is not Admin then throw Unauthorized status.

### Intercept After
Interception occurs after the next execution proceeded. For example we need to modify content of the result 
based on http status.

```typescript
import { Middleware, Invocation, ActionResult } from "plumier"

class ModifyResponseMiddleware implements CustomMiddleware {
    async execute(next: Readonly<Invocation>): Promise<ActionResult> {
        const result = await next.proceed()
        if(result.status === 500){
            //do something and return ActionResult
        }
        else
            return result
    }
}
```

### Intercept Around
Interception occurs before and after the next execution. For example we need to log the response time of every request.

```typescript 
import { Middleware, Invocation, ActionResult } from "plumier"

class ResponseTimeMiddleware implements CustomMiddleware {
    async execute(next: Readonly<Invocation>): Promise<ActionResult> {
        console.time("Response Time")
        const result = await next.execute()
        console.timeEnd("Response Time")
        return result
    }
}
```
