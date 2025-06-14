import { PropertyEntity } from "@databaseProperties/property.entity";

export class CreatePost {
    message: string;
    link: string;
    access_token: string;
    published: boolean;

    constructor(property: PropertyEntity){
        const { FRONTEND_URL, FACEBOOK_USER_ACCESS_TOKEN } = process.env;
        this.message = `${property.title}\n${property.description}`;
        this.link = `${FRONTEND_URL}/properties/${property.id}`;
        this.access_token = FACEBOOK_USER_ACCESS_TOKEN;
        this.published = property.approved;

    }
}