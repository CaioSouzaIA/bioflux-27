type SubscriptionLike = {
  service_type?: string | null;
  status?: string | null;
  subscription_plans?: {
    name?: string | null;
  } | null;
};

const isActiveSubscription = (subscription: SubscriptionLike) =>
  !subscription.status || subscription.status === 'ativo';

export const isFreePlanName = (planName?: string | null) =>
  Boolean(planName && planName.toLowerCase().includes('free'));

export const isStandardPlanName = (planName?: string | null) =>
  Boolean(planName && planName.toLowerCase().includes('standard'));

export const hasFreePlan = (subscriptions: SubscriptionLike[] = []) =>
  subscriptions.some(
    (subscription) =>
      isActiveSubscription(subscription) &&
      isFreePlanName(subscription.subscription_plans?.name)
  );

export const hasUnlimitedPlan = (subscriptions: SubscriptionLike[] = []) =>
  subscriptions.some(
    (subscription) =>
      isActiveSubscription(subscription) &&
      Boolean(subscription.subscription_plans?.name?.toLowerCase().includes('ilimitado'))
  );

export const isFreePlanCategoryLocked = (
  category: string,
  dietCount: number,
  trainingCount: number,
) => {
  if (category === 'anamnese-dieta') {
    return dietCount >= 1;
  }

  if (category === 'anamnese-treino') {
    return trainingCount >= 1;
  }

  return false;
};

export const getFreePlanCategoryLabel = (category: string) => {
  if (category === 'anamnese-dieta') {
    return 'dieta';
  }

  if (category === 'anamnese-treino') {
    return 'treino';
  }

  return 'formulário';
};
