import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// next-intl 기반의 locale-aware Link/useRouter/usePathname/redirect.
export const { Link, useRouter, usePathname, redirect, getPathname } =
  createNavigation(routing);
