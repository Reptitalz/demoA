
import { FaSpinner } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner = ({ size = 24, className }: LoadingSpinnerProps) => {
  return (
    <FaSpinner
      size={size}
      className={cn('animate-spin text-primary', className)} // Will use the new primary color (purple)
    />
  );
};

export default LoadingSpinner;
