import { ConnectionTypes } from '@/lib/types'
import React from 'react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  type: ConnectionTypes
  icon: string
  title: ConnectionTypes
  description: string
  callback?: () => void
  connected: {} & any
}

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connected,
}: Props) => {
  const notionAuthUrl = process.env.NEXT_PUBLIC_NOTION_AUTH_URL;
  console.log('Notion auth URL check:', {
    hasUrl: !!notionAuthUrl,
    url: notionAuthUrl
  });

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] dark:hover:shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <Image
              src={icon}
              alt={title}
              height={30}
              width={30}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          {connected[type] ? (
            <div className="rounded-lg border-2 border-primary px-3 py-2 font-medium text-primary">
              Connected
            </div>
          ) : (
            <Link
              href={
                title == 'Discord'
                  ? process.env.NEXT_PUBLIC_DISCORD_REDIRECT!
                  : title == 'Notion'
                  ? process.env.NEXT_PUBLIC_NOTION_AUTH_URL!
                  : title == 'Slack'
                  ? process.env.NEXT_PUBLIC_SLACK_REDIRECT!
                  : '#'
              }
              className="rounded-lg bg-primary px-3 py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Connect
            </Link>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}

export default ConnectionCard
