// lucide.d.ts
declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';
  
    export const ArrowUpCircle: FC<SVGProps<SVGSVGElement>>;
  
    // Add other icons you use here to avoid TypeScript errors
    // if they are not directly in the main library type definitions.
    // For example:
    // export const Home: FC<SVGProps<SVGSVGElement>>;
    // export const Search: FC<SVGProps<SVGSVGElement>>;
    
    // You can re-export all from the original module if needed
    export * from 'lucide-react/dist/lucide-react';
}
