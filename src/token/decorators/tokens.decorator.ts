import { TOKEN_VALUES } from "../../../lib/constants";
import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const Tokens = createParamDecorator((token: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    let cookies = {};
    TOKEN_VALUES.forEach(token => {
        if (Object.keys(request.cookies).includes(token)) {
            cookies[token] = request.cookies[token];
        }
    })
    if (token) {
        return cookies[token];
    }

    return cookies;
})