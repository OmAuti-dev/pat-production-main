import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

export async function GET(req: NextRequest) {
  try {
    console.log('Notion callback initiated');
    const code = req.nextUrl.searchParams.get('code');
    const error = req.nextUrl.searchParams.get('error');
    
    console.log('Authorization code received:', code);
    
    if (error) {
      console.error('Error from Notion:', error);
      return NextResponse.redirect('https://localhost:3000/connections?error=notion_' + error);
    }

    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect('https://localhost:3000/connections?error=no_code');
    }

    // Verify required environment variables
    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_API_SECRET;
    const redirectUri = process.env.NOTION_REDIRECT_URI || 'https://localhost:3000/api/auth/callback/notion';

    if (!clientId || !clientSecret) {
      console.error('Missing required environment variables');
      return NextResponse.redirect('https://localhost:3000/connections?error=config_error');
    }

    // Log environment variables (without exposing secrets)
    console.log('Environment check:', {
      hasClientId: !!clientId,
      hasApiSecret: !!clientSecret,
      redirectUri
    });

    // Encode credentials for Basic Auth
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    console.log('Attempting to exchange code for access token...');
    
    // Exchange code for access token
    const tokenResponse = await axios.post('https://api.notion.com/v1/oauth/token', 
      {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          'Authorization': `Basic ${encoded}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
      }
    );

    console.log('Token response received:', {
      hasAccessToken: !!tokenResponse.data?.access_token,
      workspace_name: tokenResponse.data?.workspace_name,
      workspace_id: tokenResponse.data?.workspace_id,
    });

    if (!tokenResponse.data || !tokenResponse.data.access_token) {
      console.error('No access token received', tokenResponse.data);
      return NextResponse.redirect('https://localhost:3000/connections?error=no_token');
    }

    // Initialize Notion client with the access token
    const notion = new Client({
      auth: tokenResponse.data.access_token,
    });

    console.log('Searching for databases...');
    
    try {
      // Search for databases
      const databasesPages = await notion.search({
        filter: {
          value: 'database',
          property: 'object',
        },
        sort: {
          direction: 'ascending',
          timestamp: 'last_edited_time',
        },
      });

      console.log('Databases found:', {
        count: databasesPages?.results?.length || 0
      });

      const databaseId = databasesPages?.results?.length
        ? databasesPages.results[0].id
        : '';

      // Construct redirect URL with all necessary parameters
      const params = new URLSearchParams({
        access_token: tokenResponse.data.access_token,
        workspace_name: tokenResponse.data.workspace_name || '',
        workspace_icon: tokenResponse.data.workspace_icon || '',
        workspace_id: tokenResponse.data.workspace_id || '',
        database_id: databaseId,
      });

      console.log('Redirecting with parameters:', {
        hasAccessToken: !!tokenResponse.data.access_token,
        hasWorkspaceName: !!tokenResponse.data.workspace_name,
        hasWorkspaceId: !!tokenResponse.data.workspace_id,
        hasDatabaseId: !!databaseId,
      });

      return NextResponse.redirect(`https://localhost:3000/connections?${params.toString()}`);
    } catch (searchError) {
      console.error('Error searching Notion databases:', searchError);
      // Even if database search fails, try to save the connection
      const params = new URLSearchParams({
        access_token: tokenResponse.data.access_token,
        workspace_name: tokenResponse.data.workspace_name || '',
        workspace_icon: tokenResponse.data.workspace_icon || '',
        workspace_id: tokenResponse.data.workspace_id || '',
        database_id: '',
      });
      return NextResponse.redirect(`https://localhost:3000/connections?${params.toString()}`);
    }
  } catch (error) {
    console.error('Error in Notion callback:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      // Return specific error message for common issues
      if (error.response?.status === 401) {
        return NextResponse.redirect('https://localhost:3000/connections?error=auth_failed');
      }
      if (error.response?.status === 403) {
        return NextResponse.redirect('https://localhost:3000/connections?error=permission_denied');
      }
    }
    return NextResponse.redirect('https://localhost:3000/connections?error=callback_error');
  }
}
