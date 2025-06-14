import { BadRequestException, HttpException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { UsersDatabaseService } from "@databaseUser/user.database.service";
import { PropertiesDatabaseService } from "@databaseProperties/property.database.service";
import { RentDTO } from "./dto/rent.dto";
import { RentsDatabaseService } from "@databaseRent/rent.database.service";
import { RentEntity } from "@databaseRent/rents.entity";
import { MESSAGES } from "@constants/messages";
import { PropertyStatus } from "../enums/status.enum";
import { MailService } from "@src/mail/mail.service";
import { PropertyEntity } from "@src/database/property/property.entity";

@Injectable()
export class RentService {
  constructor(
    private readonly usersDatabaseService: UsersDatabaseService,
    private readonly propertiesDatabaseService: PropertiesDatabaseService,
    private readonly rentsDatabaseService: RentsDatabaseService,
    private readonly mailerService: MailService,
  ) {}

  private handleException(e: any, message: string): void {
    if (e instanceof BadRequestException || e instanceof NotFoundException || e instanceof UnauthorizedException) {
      throw e;
    }
    console.error(e);
    throw new HttpException(message, 500);
  }
  
    async create(rent: RentDTO): Promise<void> {
      try {
        // Validar fechas
        this.validateDates(rent.checkIn, rent.checkOut);
  
        // Validar propiedad
        const property = await this.validateProperty(rent.propertyId);
  
        // Validar conflictos de fechas
        await this.validateExistingRents(rent.checkIn, rent.checkOut, property);
  
        // Obtener usuario asociado al email
        const user = await this.usersDatabaseService.findOneEmail(rent.email);
  
        // Crear la entidad de alquiler
        const rentEntity = await this.buildRentEntity(rent, property, user);
  
        // Guardar el alquiler en la base de datos
        const rentCreated = await this.rentsDatabaseService.create(rentEntity);
  
        // Enviar notificación por correo
        await this.sendRentNotification(rentCreated, property, user);
      } catch (e) {
        this.handleException(e, 'Error al alquilar');
      }
    }
  
    // Métodos auxiliares
  
    private validateDates(dateStart: Date, dateEnd: Date): void {
      if (dateStart > dateEnd) {
        throw new BadRequestException('Seleccione correctamente las fechas');
      }
    }
  
    private async validateProperty(propertyId: number): Promise<PropertyEntity> {
      const property = await this.propertiesDatabaseService.findOneByStatus(propertyId, PropertyStatus.ForRent);
      if (!property) {
        throw new NotFoundException(MESSAGES.PROPERTY_NOT_FOUND);
      }
      return property;
    }
  
    private async validateExistingRents(dateStart: Date, dateEnd: Date, property: PropertyEntity): Promise<void> {
      const existingRent = await this.rentsDatabaseService.findRentsInDateRange(dateStart, dateEnd, property);
      if (existingRent.length > 0) {
        throw new BadRequestException('Ya existe un alquiler en ese rango de fechas');
      }
    }
  
    private async buildRentEntity(rent: RentDTO, property: PropertyEntity, user: any): Promise<RentEntity> {
      return RentEntity.fromDto(rent, rent.email, property, user?.admin, user);
    }
  
    private async sendRentNotification(rent: RentEntity, property: PropertyEntity, user: any): Promise<void> {
      const emailContent = `
              <h1>Propiedad: ${property.title}</h1>
      <br />
        <div>Se creó un alquiler desde el día ${rent.checkIn.toLocaleDateString()} al ${rent.checkOut.toLocaleDateString()}</div>
        <h3>Toda reserva está sujeta a aprobación de nuestra inmobiliaria. A la brevedad nos pondremos en contacto con usted.</h3>
      `;
      await this.mailerService.sendNotificationRent(
        {
          to: rent.email,
          subject: 'Reserva en estado pendiente',
          content: emailContent,
        },
        user,
      );
    }
  

  async getByUser(userId: number): Promise<RentEntity[]> {
    const user = await this.usersDatabaseService.findOne(userId);

    if (!user) {
      throw new Error(MESSAGES.USER_NOT_FOUND);
    }

    return await this.rentsDatabaseService.findByUser(user.id);
  }

  async getByProperty(propertyId: number): Promise<RentEntity[]> {
    const propertie = await this.propertiesDatabaseService.findOne(propertyId);

    if (!propertie) {
      throw new NotFoundException(MESSAGES.PROPERTY_NOT_FOUND);
    }

    return await this.rentsDatabaseService.findPropertyRents(propertie);
  }

  async findToApproved(): Promise<RentEntity[]> {
    return await this.rentsDatabaseService.findToApprove();
  }

  async approveRent(rentId: number): Promise<void> {
    const rent = await this.rentsDatabaseService.findOne(rentId);

    if (!rent) {
      throw new NotFoundException(MESSAGES.RENT_NOT_FOUND);
    }

    rent.approved = true;
    this.rentsDatabaseService.update(rent);
  }
}


