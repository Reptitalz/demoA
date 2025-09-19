
import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

interface AppIconProps extends SVGProps<SVGSVGElement> {
  className?: string;
}

const AppIcon = ({ className, ...props }: AppIconProps) => {
  return (
    <svg
      viewBox="90 100 600 600"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      {...props}
    >
      <g stroke="#0D0D0D" strokeWidth="24" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
        <path d="M485.438 195.393c-13.92-13.92-33.64-21.84-53.84-21.84-20.2 0-39.92 7.92-53.84 21.84L223.8 349.353V219c0-16-13-29-29-29H108.8v450h115c16 0 29-13 29-29V505.353l108.64-108.64c13.92-13.92 33.64-21.84 53.84-21.84 20.2 0 39.92 7.92 53.84 21.84l104.96 104.96c13.92 13.92 21.84 33.64 21.84 53.84s-7.92 39.92-21.84 53.84L505.478 660H660.8V516.353l-175.362-175.36z" fill="#F8F8F5"/>
        <path d="M660.8 191.04v116.8c0 15.4-12.6 28-28 28H481.04c-15.4 0-28-12.6-28-28v-116.8c0-15.4 12.6-28 28-28h151.76c15.4 0 28 12.6 28 28z"/>
        <circle cx="503.84" cy="249.44" r="14"/>
        <circle cx="560.8" cy="249.44" r="14"/>
        <circle cx="617.76" cy="249.44" r="14"/>
        <path d="M439.118 111.353l-34.24 34.24M383.038 141.273l-38.64-38.64M326.958 106.873l-30.8-30.8"/>
      </g>
    </svg>
  );
};

export default AppIcon;
