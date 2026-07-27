  import { Request, Response, RequestHandler } from 'express';
  import bcrypt from 'bcrypt';
  import User from '../models/user';

  const SALT_ROUNDS = 10; // higher = more secure but slower; 10 is the standard balance

  // CREATE
  export const createUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const user = await User.create({ email, password: hashedPassword });

      // never send the password hash back in the response
      res.status(201).json({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
      });
    } catch (error: any) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ message: 'Email already exists' });
        return;
      }
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };

  // READ ALL
  export const getUsers: RequestHandler = async (req: Request, res: Response) => {
    try {
      const users = await User.findAll({
        attributes: ['id', 'email', 'createdAt', 'updatedAt'], // exclude password
      });
      res.status(200).json(users);
    } catch (error: any) {
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };

  // READ ONE
  export const getUserById: RequestHandler = async (req: Request, res: Response) => {
    try {
      const user = await User.findByPk(req.params.id as string, {
        attributes: ['id', 'email', 'createdAt', 'updatedAt'],
      });

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error: any) {
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };

  // UPDATE
  export const updateUser: RequestHandler = async (req: Request, res: Response) => {
    try {
      const user = await User.findByPk(req.params.id as string);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const { email, password } = req.body;

      if (email) user.email = email;
      if (password) user.password = await bcrypt.hash(password, SALT_ROUNDS);

      await user.save();

      res.status(200).json({
        id: user.id,
        email: user.email,
        updatedAt: user.updatedAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };

  // DELETE
  export const deleteUser:RequestHandler = async (req: Request, res: Response) => {
    try {
      const user = await User.findByPk(req.params.id as string);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      await user.destroy();
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };