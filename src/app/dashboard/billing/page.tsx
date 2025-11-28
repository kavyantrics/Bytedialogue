import BillingFormWrapper from "@/components/BillingFormWrapper"
import { getUserSubscriptionPlan } from "@/lib/stripe"

const Page = async () => {
    const subscriptionPlan = await getUserSubscriptionPlan()

    return <BillingFormWrapper subscriptionPlan={subscriptionPlan} /> 
}

export default Page