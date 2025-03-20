import { ArgumentMetadata, Injectable, Logger, PipeTransform } from "@nestjs/common";


@Injectable()
export class JSONPayloadPipe implements PipeTransform {
    transform(value: any, metadata: ArgumentMetadata) {
        try {
            if (metadata.type === "body" && Object.keys(value).includes("json_payload")) {
                value = JSON.parse(value.json_payload);
            };
        } catch (error) {
            value = {};
            Logger.log(error, "JSONPayloadPipe");
        }
        return value;
    }
}