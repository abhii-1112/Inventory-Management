import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ReportJobAttributes {
  id: string;
  format: 'csv' | 'xlsx';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filePath: string | null;
  error: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ReportJobCreationAttributes
  extends Optional<ReportJobAttributes, 'id' | 'filePath' | 'error'> {}

class ReportJob extends Model<ReportJobAttributes, ReportJobCreationAttributes> implements ReportJobAttributes {
  public id!: string;
  public format!: 'csv' | 'xlsx';
  public status!: 'pending' | 'processing' | 'completed' | 'failed';
  public filePath!: string | null;
  public error!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ReportJob.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    format: {
      type: DataTypes.ENUM('csv', 'xlsx'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    error: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'report_jobs',
    timestamps: true,
  }
);

export default ReportJob;