'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypewriterProps {
  words: string[]
  className?: string
  cursorClassName?: string
}

export const Typewriter = ({
  words,
  className,
  cursorClassName
}: TypewriterProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [typingSpeed, setTypingSpeed] = useState(150)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentWord = words[currentWordIndex]
      
      if (!isDeleting) {
        setCurrentText(currentWord.substring(0, currentText.length + 1))
        setTypingSpeed(150)
      } else {
        setCurrentText(currentWord.substring(0, currentText.length - 1))
        setTypingSpeed(75)
      }

      // If word is complete
      if (!isDeleting && currentText === currentWord) {
        setTimeout(() => setIsDeleting(true), 1500)
      }
      
      // If word has been deleted
      if (isDeleting && currentText === '') {
        setIsDeleting(false)
        setCurrentWordIndex((current) => (current + 1) % words.length)
      }
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [currentText, currentWordIndex, isDeleting, words, typingSpeed])

  return (
    <span className={cn('inline-flex', className)}>
      {currentText}
      <span 
        className={cn(
          'ml-1 inline-block w-[3px] animate-blink bg-current',
          cursorClassName
        )} 
      />
    </span>
  )
} 