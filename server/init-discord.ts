// Script to initialize Discord roles on server startup
import { initializeDiscordRoles } from './discord.js';

console.log('Initializing Discord roles on Akcent Private server...');

initializeDiscordRoles()
  .then(result => {
    if (result.success) {
      console.log('✅ Discord roles initialized successfully');
    } else {
      console.error('❌ Failed to initialize Discord roles:', result.error);
    }
  })
  .catch(error => {
    console.error('❌ Error during Discord initialization:', error);
  });
