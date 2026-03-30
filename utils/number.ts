const convertStringToNumber = (str: string | undefined | null): number => {
  if (!str) {
    return 0;
  }
  const parsedString = parseInt(str);
  return isNaN(parsedString) ? 0 : parsedString;
};

const stripNonNumericFromString = (str: string): string => {
  return str.replace(/\D/g, "");
};

const convertPercentToFraction = (percentage: number | undefined | null): number => {
  if (!percentage) {
    return 0;
  }

  return percentage / 100;
};

export default {
  convertStringToNumber(str: string | undefined | null) {
    return convertStringToNumber(str);
  },
  stripNonNumericFromString(str: string) {
    return stripNonNumericFromString(str);
  },
  convertPercentToFraction(percent: number | undefined | null) {
    return convertPercentToFraction(percent);
  },
};
