import { PropertyEntity } from "@databaseProperties/property.entity";

export class CreatePost {
  message: string;
  access_token: string;
  published: boolean;
  attached_media?: { media_fbid: string }[];

  private static NeighborhoodLabels: Record<string, string> = {
    "anaconda": "Anaconda",
    "antoniopolis": "Antoniopolis",
    "arachania": "Arachania",
    "atlantica": "Atlántica",
    "barrio-country": "Barrio Country",
    "barrio-parque": "Barrio Parque",
    "cerro-aspero-garzon": "Cerro Áspero Garzón",
    "costa-azul": "Costa Azul",
    "la-aguada": "La Aguada",
    "la-paloma": "La Paloma",
    "la-pedrera": "La Pedrera",
    "oceania-del-polonio": "Oceanía del Polonio",
    "playa-serena": "Playa Serena",
    "pueblo-nuevo": "Pueblo Nuevo",
    "punta-rubia": "Punta Rubia",
    "rocha": "Rocha",
    "san-antonio": "San Antonio",
    "san-sebastian-de-la-pedrera": "San Sebastián de la Pedrera",
    "santa-isabel": "Santa Isabel",
    "sierra-de-rocha": "Sierra de Rocha",
  };

  constructor(property: PropertyEntity, mediaFbIds?: string[]) {
    const { FACEBOOK_PAGE_ACCESS_TOKEN } = process.env;

    let message = `🏡 ${property.title}\n\n${property.description}`;

    if (property.features) {
      try {
        const parsedFeatures = JSON.parse(property.features);
        const featuresText = parsedFeatures
          .map((feature: any) => {
            if (!feature?.values?.length) return null;
            const valuesList = feature.values
              .filter((v: any) => v.value && v.value.trim() !== "")
              .map((v: any) => `• ${v.title}: ${v.value}`)
              .join("\n");
            return valuesList ? `\n🏠 ${feature.title}:\n${valuesList}` : null;
          })
          .filter(Boolean)
          .join("\n");

        if (featuresText) message += `\n\n${featuresText}`;
      } catch {
      }
    }

    if (property.area) message += `\n\n📐 Metros construidos: ${property.area} m²`;
    if (property.lotSize) message += `\n🌳 Tamaño del terreno: ${property.lotSize} m²`;

    const neighborhoodLabel =
      CreatePost.NeighborhoodLabels[property.neighborhood] ||
      property.neighborhood;

    message += `\n\n📍 Ubicación: ${neighborhoodLabel}`;
    message += `\n💰 Precio: USD ${property.price.toLocaleString()}`;

    message += `\n\n📞 Comunicate con nosotros para más información.`;

    this.message = message;
    this.access_token = FACEBOOK_PAGE_ACCESS_TOKEN;
    this.published = true;

    if (mediaFbIds?.length) {
      this.attached_media = mediaFbIds.map((id) => ({ media_fbid: id }));
    }
  }
}
