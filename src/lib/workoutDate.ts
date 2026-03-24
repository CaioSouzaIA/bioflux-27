import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import type { FormatOptions } from 'date-fns';

export const WORKOUT_DATE_TIME_ZONE = 'America/Sao_Paulo';

const saoPauloDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: WORKOUT_DATE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const getDateParts = (value: Date) => {
  const parts = saoPauloDateFormatter.formatToParts(value);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Nao foi possivel extrair a data de Sao Paulo.');
  }

  return { year, month, day };
};

export const parseWorkoutDate = (value: string) => {
  if (!value) {
    throw new Error('workout_date vazio.');
  }

  return parseISO(value.length === 7 ? `${value}-01` : value);
};

export const formatWorkoutDate = (
  value: string,
  pattern: string,
  options?: FormatOptions,
) => format(parseWorkoutDate(value), pattern, options);

export const getCurrentSaoPauloDateKey = (referenceDate: Date = new Date()) => {
  const { year, month, day } = getDateParts(referenceDate);
  return `${year}-${month}-${day}`;
};

export const getCurrentSaoPauloDate = (referenceDate: Date = new Date()) =>
  parseWorkoutDate(getCurrentSaoPauloDateKey(referenceDate));

export const getMonthBoundsForWorkoutDate = (referenceDate: Date) => ({
  start: format(startOfMonth(referenceDate), 'yyyy-MM-dd'),
  end: format(endOfMonth(referenceDate), 'yyyy-MM-dd'),
});
