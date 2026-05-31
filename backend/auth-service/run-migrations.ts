import { AppDataSource } from './ormconfig';

AppDataSource.initialize()
  .then(async () => {
    console.log('Running migrations...');
    await AppDataSource.runMigrations();
    console.log('Migrations completed successfully!');
    await AppDataSource.destroy();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during migration:', error);
    process.exit(1);
  });
