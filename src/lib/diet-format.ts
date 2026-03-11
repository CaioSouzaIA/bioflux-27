interface DietItemLike {
  name: string;
  preparation: string | null;
  quantity: string;
}

interface DietSubstitutionLike {
  name: string;
  quantity: string;
}

export const formatDietItemDescription = (item: DietItemLike) => {
  const parts = [item.name?.trim(), item.preparation?.trim()].filter(Boolean);
  const mainLabel = parts.join(' ').trim() || 'Item não informado';
  const quantity = item.quantity?.trim();

  return quantity ? `${mainLabel} - ${quantity}` : mainLabel;
};

export const formatDietSubstitutionDescription = (substitution: DietSubstitutionLike) => {
  const name = substitution.name?.trim() || 'Substituição não informada';
  const quantity = substitution.quantity?.trim();

  return quantity ? `${name} - ${quantity}` : name;
};
