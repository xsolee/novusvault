import { useWindowDimensions } from 'react-native';
import { breakpoints } from '@/constants/theme';

export function useResponsive() {
  const { width } = useWindowDimensions();
  return {
    width,
    isTablet: width >= breakpoints.tablet,
    isDesktop: width >= breakpoints.desktop,
    useSidebarNav: width >= breakpoints.tablet,
  };
}
