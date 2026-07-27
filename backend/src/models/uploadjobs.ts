import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UploadJobAttributes {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  failedRows: number;
  errors: string[]; // stored as JSON
  createdAt?: Date;
  updatedAt?: Date;
}

interface UploadJobCreationAttributes
  extends Optional<UploadJobAttributes, 'id' | 'totalRows' | 'processedRows' | 'failedRows' | 'errors'> {}

class UploadJob extends Model<UploadJobAttributes, UploadJobCreationAttributes> implements UploadJobAttributes {
  public id!: string;
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public totalRows!: number;
  public processedRows!: number;
  public failedRows!: number;
  public errors!: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UploadJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    totalRows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    processedRows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    failedRows: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    errors: {
      type: DataTypes.JSONB, // Postgres native JSON storage — lets us store an array of error messages
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'upload_jobs',
    timestamps: true,
  }
);

export default UploadJob;