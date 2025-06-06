import React from 'react'
import Workflows from './_components'
import WorkflowButton from './_components/workflow-button'
import PageHeader from '@/components/global/page-header'

const Page = () => {
  return (
    <div className="flex flex-col relative">
      <PageHeader title="Workflows">
        <WorkflowButton />
      </PageHeader>
      <Workflows />
    </div>
  )
}

export default Page
