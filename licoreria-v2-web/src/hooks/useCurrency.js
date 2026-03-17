import { useAuthStore } from '@/store/useAuthStore';

export const useCurrency = () => {
  const currency = useAuthStore((state) => state.currency);
  
  const formatMoney = (amount) => {
    const symbol = currency === 'NIO' ? 'C$' : '$';
    return `${symbol} ${parseFloat(amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const currencySymbol = currency === 'NIO' ? 'C$' : '$';

  return { formatMoney, currencySymbol, currency };
};
