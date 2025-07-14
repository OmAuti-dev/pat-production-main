'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnimatedModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function AnimatedModal({
  isOpen,
  onClose,
  children,
  className = ''
}: AnimatedModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 1
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.85,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 32,
                mass: 0.8
              }
            }}
            className={`relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 