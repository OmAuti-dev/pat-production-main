'use client'
import Workflowform from '@/components/forms/workflow-form'
import CustomModal from '@/components/global/custom-modal'
import { Button } from '@/components/ui/button'
import { useModal } from '@/providers/modal-provider'
import { Plus } from 'lucide-react'
import React from 'react'

type Props = {}

const WorkflowButton = (props: Props) => {
  const { setOpen } = useModal()

  const handleClick = () => {
    setOpen(
      <CustomModal
        title="Create a New Workflow"
        subheading="Create a new workflow to automate your tasks and processes."
      >
        <Workflowform />
      </CustomModal>
    )
  }

  return (
    <Button
      onClick={handleClick}
      size={'icon'}
      variant="outline"
    >
      <Plus className="h-4 w-4" />
    </Button>
  )
}

export default WorkflowButton
