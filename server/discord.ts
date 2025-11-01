import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=discord',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Discord not connected');
  }
  return accessToken;
}

// Get a fresh Discord client
export async function getDiscordClient() {
  const token = await getAccessToken();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages
    ]
  });

  await client.login(token);
  return client;
}

// Discord server configuration
export const DISCORD_SERVER_ID = '1434317122653393048';

// Role names for the application
export const DISCORD_ROLES = {
  ADMIN: 'Akcent Admin',
  MODERATOR: 'Akcent Moderator',
  CUSTOMER: 'Akcent Customer',
  VERIFIED: 'Verified User'
};

// Initialize Discord roles on the server
export async function initializeDiscordRoles() {
  try {
    const client = await getDiscordClient();
    const guild = await client.guilds.fetch(DISCORD_SERVER_ID);
    
    // Check and create roles if they don't exist
    const roleNames = Object.values(DISCORD_ROLES);
    const existingRoles = guild.roles.cache;
    
    for (const roleName of roleNames) {
      const roleExists = existingRoles.find(r => r.name === roleName);
      if (!roleExists) {
        await guild.roles.create({
          name: roleName,
          reason: 'Auto-created by Akcent Dashboard'
        });
        console.log(`Created Discord role: ${roleName}`);
      }
    }
    
    await client.destroy();
    return { success: true, message: 'Discord roles initialized' };
  } catch (error) {
    console.error('Error initializing Discord roles:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Assign role to a Discord user
export async function assignDiscordRole(discordUserId: string, roleName: string) {
  try {
    const client = await getDiscordClient();
    const guild = await client.guilds.fetch(DISCORD_SERVER_ID);
    const member = await guild.members.fetch(discordUserId);
    const role = guild.roles.cache.find(r => r.name === roleName);
    
    if (!role) {
      await client.destroy();
      throw new Error(`Role ${roleName} not found`);
    }
    
    await member.roles.add(role);
    await client.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error assigning Discord role:', error);
    throw error;
  }
}

// Send webhook notification
export async function sendWebhookNotification(webhookUrl: string, title: string, message: string, color: number = 0x5865F2) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(message)
      .setColor(color)
      .setTimestamp();

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [embed.toJSON()]
      })
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending webhook:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send notification to a Discord channel
export async function sendDiscordChannelMessage(channelId: string, message: string) {
  try {
    const client = await getDiscordClient();
    const channel = await client.channels.fetch(channelId) as TextChannel;
    
    if (channel && channel.isTextBased()) {
      await channel.send(message);
    }
    
    await client.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error sending Discord message:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
