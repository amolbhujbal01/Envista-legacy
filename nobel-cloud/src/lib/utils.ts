import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const getInitials = (name: string): string => {
  if (!name) return '';
  const nameParts = name.trim().split(/\s+/);
  return nameParts.length === 1
    ? nameParts[0].substring(0, 2)
    : nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0);
};

export const censorText = (
  text: string,
  toBeCensored: boolean = false,
  hint: number = 0
): string => {
  if (!toBeCensored) return text;
  if (!text) return text;
  const words = text.split(' ');
  return words
    .map((word, index) => {
      if (index === 0) {
        const visiblePart = word.slice(0, hint);
        const censoredPart = word.slice(hint).replace(/./g, '*');
        return visiblePart + censoredPart;
      } else {
        return word.replace(/./g, '*');
      }
    })
    .join(' ');
};

export const calculateAge = (dobString: string) => {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
  )
    age--;
  return age;
};
