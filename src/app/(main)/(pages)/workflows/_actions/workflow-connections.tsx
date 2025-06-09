'use server'
import { Option } from '@/components/ui/multiple-selector'
import { db } from '@/lib/db'
import { auth, currentUser } from '@clerk/nextjs'

export const getGoogleListener = async () => {
  const { userId } = auth()

  if (userId) {
    const listener = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        googleResourceId: true,
      },
    })

    if (listener) return listener
  }
}

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  console.log(state)
  const published = await db.workflow.update({
    where: {
      id: workflowId,
    },
    data: {
      publish: state,
    },
  })

  if (published.publish) return 'Workflow published'
  return 'Workflow unpublished'
}

export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string
) => {
  if (type === 'Discord') {
    const response = await db.workflow.update({
      where: {
        id: workflowId,
      },
      data: {
        discordTemplate: content,
      },
    })

    if (response) {
      return 'Discord template saved'
    }
  }
  if (type === 'Slack') {
    const response = await db.workflow.update({
      where: {
        id: workflowId,
      },
      data: {
        slackTemplate: content,
        slackAccessToken: accessToken,
      },
    })

    if (response) {
      const channelList = await db.workflow.findUnique({
        where: {
          id: workflowId,
        },
        select: {
          slackChannels: true,
        },
      })

      if (channelList?.slackChannels?.length) {
        // Remove duplicates before insert
        const nonDuplicatedChannels = channels?.map(ch => ch.value).filter(
          channel => !channelList.slackChannels.includes(channel)
        ) || []

        if (nonDuplicatedChannels.length > 0) {
          await db.workflow.update({
            where: {
              id: workflowId,
            },
            data: {
              slackChannels: {
                push: nonDuplicatedChannels,
              },
            },
          })
        }

        return 'Slack template saved'
      }

      // If no existing channels, add all new channels
      if (channels?.length) {
        await db.workflow.update({
          where: {
            id: workflowId,
          },
          data: {
            slackChannels: channels.map(ch => ch.value),
          },
        })
      }
      return 'Slack template saved'
    }
  }

  if (type === 'Notion') {
    const response = await db.workflow.update({
      where: {
        id: workflowId,
      },
      data: {
        notionTemplate: content,
        notionAccessToken: accessToken,
        notionDbId: notionDbId,
      },
    })

    if (response) return 'Notion template saved'
  }
}

export const onGetWorkflows = async () => {
  const user = await currentUser()
  if (!user) return []

  const dbUser = await db.user.findUnique({
    where: {
      clerkId: user.id,
    },
    select: {
      id: true,
    },
  })

  if (!dbUser) return []

  const workflows = await db.workflow.findMany({
    where: {
      userId: dbUser.id,
    },
  })

  return workflows
}

export const onCreateWorkflow = async (name: string, description: string) => {
  try {
    const user = await currentUser()
    if (!user) {
      return { message: 'Authentication required', error: true }
    }

    // First ensure the user exists in the database
    const dbUser = await db.user.upsert({
      where: {
        clerkId: user.id,
      },
      update: {},  // No updates needed if user exists
      create: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName} ${user.lastName}`.trim(),
        profileImage: user.imageUrl,
      },
    })

    // Now create the workflow
    const workflow = await db.workflow.create({
      data: {
        userId: dbUser.id,
        name,
        description,
      },
    })

    if (workflow) return { message: 'Workflow created successfully', error: false }
    return { message: 'Failed to create workflow', error: true }
  } catch (error) {
    console.error('Error creating workflow:', error)
    return { message: 'An unexpected error occurred', error: true }
  }
}

export const onGetNodesEdges = async (flowId: string) => {
  const nodesEdges = await db.workflow.findUnique({
    where: {
      id: flowId,
    },
    select: {
      nodes: true,
      edges: true,
    },
  })
  if (nodesEdges?.nodes && nodesEdges?.edges) return nodesEdges
}
