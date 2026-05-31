import { AppDataSource } from './ormconfig';

async function runMigrations() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    await AppDataSource.runMigrations();
    console.log('Migrations have been run successfully!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
}

runMigrations();
