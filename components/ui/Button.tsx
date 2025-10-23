import React from 'react';

// FIX: Made the Button component polymorphic to support the 'as' prop.
// This allows rendering the button as other components, like a react-router-dom Link,
// fixing type errors where it was used for navigation in `pages/Blog.tsx`.

// Base props shared by all variants of the button.
type BaseButtonProps = {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
};

// Props for the component when rendered as a specific element type `C`.
// It includes our base props, an `as` prop, and all other props of `C`
// except for the ones we've defined in `BaseButtonProps`.
type ButtonProps<C extends React.ElementType> = BaseButtonProps & {
  as?: C;
} & Omit<React.ComponentPropsWithoutRef<C>, keyof BaseButtonProps | 'as'>;

// The component is now a generic function component to support polymorphism.
const Button = <C extends React.ElementType = 'button'>({
  children,
  className,
  variant = 'primary',
  size = 'md',
  as,
  ...props
}: ButtonProps<C>) => {
  // If `as` prop is provided, we use it. Otherwise, default to 'button'.
  const Component = as || 'button';

  const baseClasses = 'inline-flex items-center justify-center border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

  const variantClasses = {
    primary: 'text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
    destructive: 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  };

  const sizeClasses = {
    sm: 'p-2 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <Component
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Button;
