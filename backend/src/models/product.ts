import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Category from './category';

interface ProductAttributes {
  id: string;
  name: string;
  image: string | null;
  price: number;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'image'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public name!: string;
  public image!: string | null;
  public price!: number;
  public categoryId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    image: {
      type: DataTypes.STRING, // stores the file path/URL, not the binary itself
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2), // 10 digits total, 2 after decimal — correct for money (avoids float rounding issues)
      allowNull: false,
      validate: {
        min: 0, // price can't be negative
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Category,
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
  }
);

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

export default Product;

