'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Sparkles,
  ArrowRight,
  Ticket,
  Building2,
  Globe,
  Shield,
  Zap,
  UserPlus,
  Settings,
  Rocket,
  Star,
  Check,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  MessageSquare,
  Heart,
  ArrowUp
} from 'lucide-react'

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 animate-in slide-in-from-top-2 duration-300">
          {answer}
        </div>
      )}
    </div>
  )
}

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-10'
        } ${className}`}
    >
      {children}
    </div>
  )
}

export default function LandingPage() {
  const { user, token } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      // Show button when user scrolls down more than 300px
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // Prevent hydration mismatch by not checking auth until mounted
  // On server, always render as unauthenticated to match initial client render
  const isAuthenticated = mounted ? !!(user && token) : false

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                EventSaaS
              </span>
            </div>
            <div className="flex items-center space-x-4" suppressHydrationWarning>
              <ThemeToggle />
              {isAuthenticated ? (
                <>
                  <Link
                    href={user?.role === 'SUPER_ADMIN' ? '/super-admin' : user?.role === 'TENANT_ADMIN' || user?.role === 'TENANT_USER' ? '/tenant' : '/events'}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <Image
            src="https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=1920&h=1080&fit=crop&q=80"
            alt="Event background"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200 dark:border-gray-700">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  The Future of Event Management
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                  Create, Manage, and
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  Host Amazing Events
                </span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
                The all-in-one platform for event organizers. Manage registrations, process payments,
                track analytics, and deliver unforgettable experiences to your attendees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  href="/tenant/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all"
                >
                  <Building2 className="mr-2 h-5 w-5" />
                  For Organizations
                </Link>
              </div>
              <div className="flex items-center space-x-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">10K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Events Hosted</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">50K+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Happy Attendees</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">500+</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Organizations</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] relative">
                  <Image
                    src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop&q=80"
                    alt="Modern conference event with people networking"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                    <div className="p-8 text-white">
                      <div className="text-2xl font-bold mb-2">Event Management</div>
                      <div className="text-white/90">Made Simple</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl opacity-20 blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Powerful features designed to make event management effortless
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: 'Event Management',
                  description: 'Create and manage events with ease. Set dates, venues, capacity, and pricing all in one place.',
                  color: 'from-blue-500 to-blue-600',
                },
                {
                  icon: Users,
                  title: 'Registration System',
                  description: 'Streamlined registration process with customizable forms and automated confirmation emails.',
                  color: 'from-indigo-500 to-indigo-600',
                },
                {
                  icon: CreditCard,
                  title: 'Payment Processing',
                  description: 'Secure payment processing with Stripe integration. Accept payments from anywhere in the world.',
                  color: 'from-purple-500 to-purple-600',
                },
                {
                  icon: BarChart3,
                  title: 'Analytics Dashboard',
                  description: 'Track event performance with real-time analytics. Monitor registrations, revenue, and attendance.',
                  color: 'from-pink-500 to-pink-600',
                },
                {
                  icon: Ticket,
                  title: 'Digital Tickets',
                  description: 'Generate and manage digital tickets. QR code scanning for seamless check-in experience.',
                  color: 'from-green-500 to-green-600',
                },
                {
                  icon: Building2,
                  title: 'Multi-Tenant',
                  description: 'Perfect for organizations managing multiple events. White-label solution with custom branding.',
                  color: 'from-orange-500 to-orange-600',
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-transparent hover:shadow-xl transition-all duration-300"
                >
                  <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Get started in minutes, not days
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '01',
                  title: 'Create Your Account',
                  description: 'Sign up as an attendee or create an organization account to start managing events.',
                  icon: UserPlus,
                },
                {
                  step: '02',
                  title: 'Set Up Your Event',
                  description: 'Add event details, set pricing, configure registration options, and customize your event page.',
                  icon: Settings,
                },
                {
                  step: '03',
                  title: 'Launch & Manage',
                  description: 'Share your event, process registrations, collect payments, and track everything in real-time.',
                  icon: Rocket,
                },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-2xl font-bold mb-4 shadow-lg">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 transform translate-x-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Why Choose EventSaaS?
                </h2>
                <div className="space-y-6">
                  {[
                    {
                      icon: Zap,
                      title: 'Lightning Fast',
                      description: 'Built for performance. Create and manage events in seconds, not minutes.',
                    },
                    {
                      icon: Shield,
                      title: 'Secure & Reliable',
                      description: 'Bank-level security with encrypted payments and data protection.',
                    },
                    {
                      icon: Globe,
                      title: 'Global Reach',
                      description: 'Accept payments from anywhere. Support multiple currencies and languages.',
                    },
                    {
                      icon: Sparkles,
                      title: 'Beautiful Design',
                      description: 'Modern, responsive design that works perfectly on all devices.',
                    },
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                          <benefit.icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                          {benefit.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="aspect-[4/3] relative">
                    <Image
                      src="https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=600&fit=crop&q=80"
                      alt="People connecting and networking at an event"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end">
                      <div className="p-8 text-white">
                        <div className="text-2xl font-bold mb-2">Connect with</div>
                        <div className="text-2xl font-bold">Your Audience</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-6 -left-6 w-full h-full bg-gradient-to-br from-blue-400 to-indigo-400 rounded-2xl opacity-20 blur-3xl -z-10"></div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Loved by Event Organizers
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                See what our customers are saying
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Sarah Johnson',
                  role: 'Event Director',
                  company: 'TechCon Events',
                  content: 'EventSaaS has transformed how we manage our conferences. The registration process is seamless and our attendees love the experience!',
                  rating: 5,
                  avatar: 'SJ',
                },
                {
                  name: 'Michael Chen',
                  role: 'Marketing Manager',
                  company: 'Startup Summit',
                  content: 'The analytics dashboard gives us incredible insights. We can track everything in real-time and make data-driven decisions.',
                  rating: 5,
                  avatar: 'MC',
                },
                {
                  name: 'Emily Rodriguez',
                  role: 'Community Manager',
                  company: 'Local Meetups',
                  content: 'Setting up events has never been easier. The multi-tenant feature allows us to manage multiple event series effortlessly.',
                  rating: 5,
                  avatar: 'ER',
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 italic">
                    &quot;{testimonial.content}&quot;
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-blue-500/20">
                      <Image
                        src={`https://images.unsplash.com/photo-${index === 0 ? '1494790108377-be9c29b29330' : index === 1 ? '1507003211169-0a1dd7228f2d' : '1438761681033-6461ffad8d80'}?w=100&h=100&fit=crop&q=80`}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { icon: Users, value: '50K+', label: 'Active Users', color: 'from-blue-500 to-blue-600' },
                { icon: Calendar, value: '10K+', label: 'Events Hosted', color: 'from-indigo-500 to-indigo-600' },
                { icon: TrendingUp, value: '99.9%', label: 'Uptime', color: 'from-purple-500 to-purple-600' },
                { icon: Heart, value: '4.9/5', label: 'User Rating', color: 'from-pink-500 to-pink-600' },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="text-center group"
                >
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Choose the plan that works best for you
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: 'Starter',
                  price: '$29',
                  period: '/month',
                  description: 'Perfect for small events',
                  features: [
                    'Up to 5 events per month',
                    '500 registrations',
                    'Basic analytics',
                    'Email support',
                    'Custom branding',
                  ],
                  popular: false,
                  color: 'from-gray-500 to-gray-600',
                },
                {
                  name: 'Professional',
                  price: '$99',
                  period: '/month',
                  description: 'For growing organizations',
                  features: [
                    'Unlimited events',
                    '10,000 registrations',
                    'Advanced analytics',
                    'Priority support',
                    'Custom branding',
                    'API access',
                    'Multi-user accounts',
                  ],
                  popular: true,
                  color: 'from-blue-500 to-indigo-600',
                },
                {
                  name: 'Enterprise',
                  price: 'Custom',
                  period: '',
                  description: 'For large organizations',
                  features: [
                    'Unlimited everything',
                    'Dedicated support',
                    'Custom integrations',
                    'SLA guarantee',
                    'White-label solution',
                    'Advanced security',
                    'Training & onboarding',
                  ],
                  popular: false,
                  color: 'from-purple-500 to-pink-600',
                },
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 transform hover:scale-105 ${plan.popular ? 'ring-4 ring-blue-500 dark:ring-blue-400 scale-105' : ''
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                        {plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/register"
                    className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-all ${plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Everything you need to know
              </p>
            </div>
            <div className="space-y-4">
              {[
                {
                  question: 'How do I get started?',
                  answer: 'Simply sign up for an account, choose your plan, and start creating events. You can have your first event live in minutes!',
                },
                {
                  question: 'Can I customize the event pages?',
                  answer: 'Yes! All plans include custom branding. You can customize colors, logos, and even use your own domain with higher-tier plans.',
                },
                {
                  question: 'What payment methods do you support?',
                  answer: 'We support all major credit cards, debit cards, and PayPal through our secure Stripe integration. We also support bank transfers for enterprise customers.',
                },
                {
                  question: 'Is there a mobile app?',
                  answer: 'Our platform is fully responsive and works perfectly on mobile devices. We also provide QR code scanning for check-ins using any smartphone.',
                },
                {
                  question: 'Can I export my data?',
                  answer: 'Absolutely! You can export all your event data, registrations, and analytics at any time in CSV or JSON format.',
                },
              ].map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Integrations Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <AnimatedSection>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                Integrations & Partners
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Connect with the tools you already use
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
              {[
                { name: 'Stripe', icon: CreditCard },
                { name: 'Mailchimp', icon: MessageSquare },
                { name: 'Slack', icon: MessageSquare },
                { name: 'Zapier', icon: Zap },
                { name: 'Google Analytics', icon: BarChart3 },
                { name: 'Zoom', icon: Users },
              ].map((integration, index) => (
                <div
                  key={index}
                  className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-110 border border-gray-200 dark:border-gray-700"
                >
                  <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 mb-4 group-hover:rotate-6 transition-transform">
                    <integration.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                    {integration.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
            Ready to Transform Your Events?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of organizations already using EventSaaS to create unforgettable experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-blue-600 bg-white rounded-lg hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-white/10 backdrop-blur-sm border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">EventSaaS</span>
              </div>
              <p className="text-sm">
                The all-in-one platform for event management and registration.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/events" className="hover:text-white transition-colors">Events</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Register</Link></li>
                <li><Link href="/tenant/signup" className="hover:text-white transition-colors">For Organizations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Account</h3>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
                <li><Link href="/tenant/login" className="hover:text-white transition-colors">Organization Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} EventSaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6" />
      </button>
    </div>
  )
}
