'use server'

import { db } from '@/lib/db'
import { currentUser } from '@clerk/nextjs'
import { Client } from '@notionhq/client'

export const onNotionConnect = async (
  access_token: string,
  workspace_id: string,
  workspace_icon: string,
  workspace_name: string,
  database_id: string,
  id: string
) => {
  try {
    console.log('Notion connection attempt started', {
      hasAccessToken: !!access_token,
      hasWorkspaceId: !!workspace_id,
      hasWorkspaceName: !!workspace_name,
      hasDatabaseId: !!database_id,
      hasUserId: !!id
    });

    if (!access_token) {
      console.error('No access token provided');
      return { error: 'No access token provided' };
    }

    if (!workspace_id || !workspace_name || !database_id) {
      console.error('Missing required Notion workspace information', {
        hasWorkspaceId: !!workspace_id,
        hasWorkspaceName: !!workspace_name,
        hasDatabaseId: !!database_id
      });
      return { error: 'Missing workspace information' };
    }

    console.log('Checking for existing Notion connection...');
    
    //check if notion is connected
    const notion_connected = await db.notion.findFirst({
      where: {
        accessToken: access_token,
      },
      include: {
        connections: {
          select: {
            type: true,
          },
        },
      },
    });

    console.log('Existing connection check result:', {
      isConnected: !!notion_connected
    });

    if (!notion_connected) {
      console.log('Creating new Notion connection...');
      
      //create connection
      const newConnection = await db.notion.create({
        data: {
          userId: id,
          workspaceIcon: workspace_icon || '',
          accessToken: access_token,
          workspaceId: workspace_id,
          workspaceName: workspace_name,
          databaseId: database_id,
          connections: {
            create: {
              userId: id,
              type: 'Notion',
            },
          },
        },
      });

      console.log('New connection created successfully');
      return { success: true, connection: newConnection };
    }

    console.log('Using existing Notion connection');
    return { success: true, connection: notion_connected };
  } catch (error) {
    console.error('Error connecting Notion:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return { error: 'Failed to connect Notion' };
  }
}

export const getNotionConnection = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: 'No user found' };
    }

    const connection = await db.notion.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (connection) {
      return connection;
    }

    return { error: 'No Notion connection found' };
  } catch (error) {
    console.error('Error getting Notion connection:', error);
    return { error: 'Failed to get Notion connection' };
  }
}

export const getNotionDatabase = async (
  databaseId: string,
  accessToken: string
) => {
  try {
    if (!databaseId || !accessToken) {
      return { error: 'Missing database ID or access token' };
    }

    const notion = new Client({
      auth: accessToken,
    });

    const response = await notion.databases.retrieve({ database_id: databaseId });
    return response;
  } catch (error) {
    console.error('Error getting Notion database:', error);
    return { error: 'Failed to get Notion database' };
  }
}

export const onCreateNewPageInDatabase = async (
  databaseId: string,
  accessToken: string,
  content: string
) => {
  try {
    if (!databaseId || !accessToken) {
      return { error: 'Missing database ID or access token' };
    }

    const notion = new Client({
      auth: accessToken,
    });

    const response = await notion.pages.create({
      parent: {
        type: 'database_id',
        database_id: databaseId,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: content,
              },
            },
          ],
        },
      },
    });

    return response;
  } catch (error) {
    console.error('Error creating Notion page:', error);
    return { error: 'Failed to create Notion page' };
  }
}
