import { PropertyEntity } from "@databaseProperties/property.entity";

export class CreatePost {
  message: string;
  link: string;
  access_token: string;
  published: boolean;
  attached_media?: { media_fbid: string }[];

  constructor(property: PropertyEntity, mediaFbIds?: string[]) {
    const { FRONTEND_URL, FACEBOOK_PAGE_ACCESS_TOKEN } = process.env;

    this.message = `${property.title}\n\n${property.description}`;
    //this.link = `${FRONTEND_URL}/properties/${property.id}`;
    this.access_token = FACEBOOK_PAGE_ACCESS_TOKEN;
    this.published = property.approved;

    if (mediaFbIds?.length) {
      this.attached_media = mediaFbIds.map(id => ({ media_fbid: id }));
    }
  }
}
