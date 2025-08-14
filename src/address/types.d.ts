import { IWithTransactionClient } from 'src/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { DatabaseId } from 'lib/types';

interface ICreate extends IWithTransactionClient {
  user_id: DatabaseId;
  createAddressDto: CreateAddressDto;
}

interface IUpdate extends IWithTransactionClient {
  address_id: DatabaseId;
  updateAddressDto: UpdateAddressDto;
}

interface IRemove extends IWithTransactionClient {
  address_id: DatabaseId;
}

interface IFindOneByLabel {
  user_id: DatabaseId;
  /**
   * @property If supplied, address with this id will not be fetched.
   */
  address_id?: DatabaseId;
}
