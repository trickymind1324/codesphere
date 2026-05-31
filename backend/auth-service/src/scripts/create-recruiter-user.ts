import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserTier } from '../entities/user.entity';

async function createRecruiterUser() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'codesphere_auth',
    entities: [User],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Database connected');

    const userRepository = dataSource.getRepository(User);

    // Check if recruiter user already exists
    const existingUser = await userRepository.findOne({
      where: { email: 'recruiter@codesphere.com' },
    });

    if (existingUser) {
      console.log('Recruiter user already exists!');
      console.log('Email: recruiter@codesphere.com');
      console.log('You can use the existing user or delete it first.');
      await dataSource.destroy();
      return;
    }

    // Create recruiter user
    const passwordHash = await bcrypt.hash('Recruiter123!', 10);

    const recruiterUser = userRepository.create({
      email: 'recruiter@codesphere.com',
      password_hash: passwordHash,
      full_name: 'Demo Recruiter',
      role: UserRole.RECRUITER,
      tier: UserTier.PRO,
      email_verified: true, // Auto-verify for demo
      failed_login_attempts: 0,
    });

    await userRepository.save(recruiterUser);

    console.log('✅ Demo recruiter user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log('==================');
    console.log('Email:    recruiter@codesphere.com');
    console.log('Password: Recruiter123!');
    console.log('Role:     recruiter');
    console.log('==================');
    console.log('');
    console.log('You can now login and access the recruiter dashboard at:');
    console.log('http://localhost:3000/recruiter/dashboard');

    await dataSource.destroy();
  } catch (error) {
    console.error('Error creating recruiter user:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

createRecruiterUser();
