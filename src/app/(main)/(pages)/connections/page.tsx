import { CONNECTIONS } from '@/lib/constant'
import React from 'react'
import ConnectionCard from './_components/connection-card'
import { currentUser } from '@clerk/nextjs'
import { onDiscordConnect } from './_actions/discord-connection'
import { onNotionConnect } from './_actions/notion-connection'
import { onSlackConnect } from './_actions/slack-connection'
import { getUserData } from './_actions/get-user'

type Props = {
  searchParams?: { [key: string]: string | undefined }
}

const Connections = async (props: Props) => {
  const {
    webhook_id,
    webhook_name,
    webhook_url,
    guild_id,
    guild_name,
    channel_id,
    access_token,
    workspace_name,
    workspace_icon,
    workspace_id,
    database_id,
    app_id,
    authed_user_id,
    authed_user_token,
    slack_access_token,
    bot_user_id,
    team_id,
    team_name,
    error,
  } = props.searchParams ?? {
    webhook_id: '',
    webhook_name: '',
    webhook_url: '',
    guild_id: '',
    guild_name: '',
    channel_id: '',
    access_token: '',
    workspace_name: '',
    workspace_icon: '',
    workspace_id: '',
    database_id: '',
    app_id: '',
    authed_user_id: '',
    authed_user_token: '',
    slack_access_token: '',
    bot_user_id: '',
    team_id: '',
    team_name: '',
    error: '',
  }

  const user = await currentUser()
  if (!user) return null

  const onUserConnections = async () => {
    // If there's an error in the URL, log it and return early
    if (error) {
      console.error('Connection error:', error);
      return { error };
    }

    console.log('Notion connection parameters:', {
      access_token,
      workspace_id,
      workspace_icon,
      workspace_name,
      database_id,
      userId: user.id
    });

    // Only attempt connections if we have the required parameters
    if (channel_id && webhook_id && webhook_name && webhook_url && guild_name && guild_id) {
      await onDiscordConnect(
        channel_id,
        webhook_id,
        webhook_name,
        webhook_url,
        user.id,
        guild_name,
        guild_id
      )
    }

    if (access_token && workspace_id && workspace_name && database_id) {
      console.log('Attempting Notion connection...');
      const notionResult = await onNotionConnect(
        access_token,
        workspace_id,
        workspace_icon || '',
        workspace_name,
        database_id,
        user.id
      )
      console.log('Notion connection result:', notionResult);
    }

    if (app_id && authed_user_id && authed_user_token && slack_access_token && bot_user_id && team_id && team_name) {
      await onSlackConnect(
        app_id,
        authed_user_id,
        authed_user_token,
        slack_access_token,
        bot_user_id,
        team_id,
        team_name,
        user.id
      )
    }

    const connections: any = {}

    const user_info = await getUserData(user.id)
    console.log('User info retrieved:', {
      hasConnections: !!user_info?.connections,
      connectionCount: user_info?.connections?.length
    });

    //get user info with all connections
    user_info?.connections.map((connection: { type: string }) => {
      connections[connection.type] = true
      return (connections[connection.type] = true)
    })

    // Google Drive connection will always be true
    // as it is given access during the login process
    return { ...connections, 'Google Drive': true }
  }

  const connections = await onUserConnections()

  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Connections
      </h1>
      {error && (
        <div className="mx-6 rounded-md bg-red-500/10 p-4 text-red-500">
          {error === 'no_code' && 'Authorization code not received from Notion. Please try connecting again.'}
          {error === 'no_token' && 'Could not get access token from Notion. Please try connecting again.'}
          {error === 'callback_error' && 'An error occurred while connecting to Notion. Please try again.'}
          {error === 'config_error' && 'Notion integration is not properly configured. Please contact support.'}
          {error === 'auth_failed' && 'Authentication failed. Please try connecting again.'}
          {error === 'permission_denied' && 'Notion denied access. Please check your workspace permissions and try again.'}
          {error.startsWith('notion_') && 'Notion returned an error: ' + error.replace('notion_', '')}
          
          {/* Discord Errors */}
          {error === 'discord_no_code' && 'Authorization code not received from Discord. Please try connecting again.'}
          {error === 'discord_no_token' && 'Could not get access token from Discord. Please try connecting again.'}
          {error === 'discord_no_webhook' && 'No webhook data received from Discord. Please make sure you have the right permissions.'}
          {error === 'discord_guild_not_found' && 'Could not find the Discord server. Please make sure you have the right permissions.'}
          {error === 'discord_config_error' && 'Discord integration is not properly configured. Please contact support.'}
          {error === 'discord_callback_error' && 'An error occurred while connecting to Discord. Please try again.'}
          {error.startsWith('discord_') && !['discord_no_code', 'discord_no_token', 'discord_no_webhook', 'discord_guild_not_found', 'discord_config_error', 'discord_callback_error'].includes(error) && 
            'Discord returned an error: ' + error.replace('discord_', '')}
        </div>
      )}
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 p-6 text-muted-foreground">
          Connect all your apps directly from here. You may need to connect
          these apps regularly to refresh verification
          {CONNECTIONS.map((connection) => (
            <ConnectionCard
              key={connection.title}
              description={connection.description}
              title={connection.title}
              icon={connection.image}
              type={connection.title}
              connected={connections}
            />
          ))}
        </section>
      </div>
    </div>
  )
}

export default Connections
