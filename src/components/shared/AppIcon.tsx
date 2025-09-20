import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AppIconProps {
  className?: string;
}

const AppIcon = ({ className, ...props }: AppIconProps) => {
  return (
    <Image
      src="/heymanito-icon.svg"
      alt="Hey Manito Icon"
      width={100}
      height={100}
      className={cn(className)}
      {...props}
    />
  );
};

export default AppIcon;
