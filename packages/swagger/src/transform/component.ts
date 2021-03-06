import { Class, isCustomClass } from "@plumier/core"
import { ComponentsObject, SchemaObject, SecuritySchemeObject } from "openapi3-ts"
import reflect from "tinspector"

import { refFactory, transformType } from "./schema"
import { TransformContext } from "./shared"

type SchemasObject = { [key: string]: SchemaObject }

const defaultSchemas: { [key: string]: SchemaObject } = {
    "System-ValidationError": {
        type: "object",
        properties: {
            status: { type: "number" },
            message: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        path: { type: "array", items: { type: "string" } },
                        messages: { type: "array", items: { type: "string" } }
                    }
                }
            }
        }
    },
    "System-DefaultErrorMessage": {
        type: "object",
        properties: {
            status: { type: "number" },
            message: { type: "string" }
        }
    }
}

function createSchema(obj: Class, ctx: TransformContext): SchemaObject {
    const meta = reflect(obj)
    const properties: SchemasObject = {}
    for (const prop of meta.properties) {
        properties[prop.name] = transformType(prop.type, ctx, { decorators: prop.decorators })
    }
    return { type: "object", properties }
}

function getUnregisterDependentTypes(type: Class, ctx: TransformContext): Class[] {
    const meta = reflect(type)
    const registered = Array.from(ctx.map.keys())
    const types = []
    for (const prop of meta.properties) {
        const propType = Array.isArray(prop.type) ? prop.type[0] : prop.type
        if (isCustomClass(propType) && !registered.some(x => x === propType)) {
            //register the property type immediately to prevent circular loop
            refFactory(ctx.map)(propType)
            const childTypes = getUnregisterDependentTypes(propType, ctx)
            types.push(...childTypes)
            types.push(propType)
        }
    }
    return types;
}

function transformComponent(ctx: TransformContext): ComponentsObject {
    const getRef = refFactory(ctx.map)
    const types = Array.from(ctx.map.keys())
    const bearer: SecuritySchemeObject = { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    const schemas: SchemasObject = types.reduce((a, b) => {
        const result = { ...a }
        // loop through unregistered dependent types
        const dependents = getUnregisterDependentTypes(b, ctx)
        for (const type of dependents) {
            result[getRef(type)!] = createSchema(type, ctx)
        }
        // create schema of the type
        result[getRef(b)!] = createSchema(b, ctx)
        return result
    }, defaultSchemas)
    const result: ComponentsObject = { schemas }
    if (ctx.config.enableAuthorization)
        result.securitySchemes = { bearer }
    return result
}

export { transformComponent }