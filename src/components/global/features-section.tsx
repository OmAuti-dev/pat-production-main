'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  KanbanSquare, 
  Workflow, 
  Bot, 
  Network, 
  Shield, 
  LineChart,
  Clock
} from 'lucide-react'

const features = [
  {
    title: "Team Management",
    description: "Efficiently organize and manage teams with role-based access control and skill tracking.",
    icon: Users
  },
  {
    title: "Project Tracking",
    description: "Monitor project progress, deadlines, and resources with our intuitive Kanban board.",
    icon: KanbanSquare
  },
  {
    title: "Workflow Automation",
    description: "Create and automate custom workflows to streamline your business processes.",
    icon: Workflow
  },
  {
    title: "AI Integration",
    description: "Leverage AI-powered insights and automation for smarter decision making.",
    icon: Bot
  },
  {
    title: "Collaboration Tools",
    description: "Connect and communicate seamlessly with built-in collaboration features.",
    icon: Network
  },
  {
    title: "Security & Compliance",
    description: "Enterprise-grade security with role-based permissions and data protection.",
    icon: Shield
  },
  {
    title: "Analytics & Reporting",
    description: "Comprehensive analytics and reporting tools for data-driven decisions.",
    icon: LineChart
  },
  {
    title: "Real-time Updates",
    description: "Stay informed with real-time project updates and notifications.",
    icon: Clock
  }
]

export const FeaturesSection = () => {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Everything you need to manage projects, automate workflows, and boost team productivity
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 hover:border-purple-500/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-400">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
} 