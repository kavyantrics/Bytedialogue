import { NextResponse } from 'next/server'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})

export async function POST() {
  try {
    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!process.env.STRIPE_PRICE_ID) {
      return new NextResponse('Stripe price ID not configured', { status: 500 })
    }

    // Validate that it's a price ID, not a product ID
    if (!process.env.STRIPE_PRICE_ID.startsWith('price_')) {
      return new NextResponse(
        `Invalid Stripe Price ID format. Price IDs must start with "price_". You provided: "${process.env.STRIPE_PRICE_ID}". This looks like a Product ID (starts with "prod_"). Please get the Price ID from your Stripe dashboard: Products → Your Product → Pricing → Copy Price ID.`,
        { status: 500 }
      )
    }

    // Ensure URL has proper scheme
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
      ? `${baseUrl}/dashboard?success=true`
      : `http://${baseUrl}/dashboard?success=true`
    const cancelUrl = baseUrl.startsWith('http://') || baseUrl.startsWith('https://')
      ? `${baseUrl}/dashboard?canceled=true`
      : `http://${baseUrl}/dashboard?canceled=true`

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating Stripe session:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 