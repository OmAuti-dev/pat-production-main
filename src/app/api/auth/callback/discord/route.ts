import axios from 'axios'
import { NextResponse, NextRequest } from 'next/server'
import url from 'url'

export async function GET(req: NextRequest) {
  try {
    console.log('Discord callback initiated');
    const code = req.nextUrl.searchParams.get('code')
    const error = req.nextUrl.searchParams.get('error')
    const error_description = req.nextUrl.searchParams.get('error_description')

    if (error) {
      console.error('Error from Discord:', error, error_description);
      return NextResponse.redirect(`https://localhost:3000/connections?error=discord_${error}`);
    }

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect('https://localhost:3000/connections?error=discord_no_code');
    }

    // Verify required environment variables
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing Discord credentials');
      return NextResponse.redirect('https://localhost:3000/connections?error=discord_config_error');
    }

    console.log('Exchanging code for access token...');
    const data = new url.URLSearchParams()
    data.append('client_id', clientId)
    data.append('client_secret', clientSecret)
    data.append('grant_type', 'authorization_code')
    data.append(
      'redirect_uri',
      'https://localhost:3000/api/auth/callback/discord'
    )
    data.append('code', code.toString())

    const output = await axios.post(
      'https://discord.com/api/oauth2/token',
      data,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    )

    if (!output.data || !output.data.access_token) {
      console.error('No access token received');
      return NextResponse.redirect('https://localhost:3000/connections?error=discord_no_token');
    }

    console.log('Access token received, fetching guild information...');
    const access = output.data.access_token
    const UserGuilds = await axios.get(
      `https://discord.com/api/users/@me/guilds`,
      {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      }
    )

    if (!output.data.webhook) {
      console.error('No webhook data received');
      return NextResponse.redirect('https://localhost:3000/connections?error=discord_no_webhook');
    }

    const UserGuild = UserGuilds.data.filter(
      (guild: any) => guild.id === output.data.webhook.guild_id
    )

    if (!UserGuild.length) {
      console.error('Guild not found');
      return NextResponse.redirect('https://localhost:3000/connections?error=discord_guild_not_found');
    }

    console.log('Successfully processed Discord connection');
    return NextResponse.redirect(
      `https://localhost:3000/connections?webhook_id=${output.data.webhook.id}&webhook_url=${output.data.webhook.url}&webhook_name=${output.data.webhook.name}&guild_id=${output.data.webhook.guild_id}&guild_name=${UserGuild[0].name}&channel_id=${output.data.webhook.channel_id}`
    )
  } catch (error) {
    console.error('Error in Discord callback:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }
    return NextResponse.redirect('https://localhost:3000/connections?error=discord_callback_error');
  }
}
