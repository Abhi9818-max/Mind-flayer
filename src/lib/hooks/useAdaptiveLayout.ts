import { useEffect, useState, useMemo } from 'react';
import { getAdaptivePageRanking, trackPageVisit } from '@/lib/services/analytics';

type NavItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
};

/**
 * Hook that provides adaptive navigation ordering based on user behavior
 */
export function useAdaptiveLayout(items: NavItem[], currentPath: string): NavItem[] {
    const [orderedItems, setOrderedItems] = useState<NavItem[]>(items);

    // Create a stable reference for items based on hrefs
    const itemsKey = useMemo(() => {
        return items.map(i => i.href).join(',');
    }, [items]);

    useEffect(() => {
        // Track this page visit
        trackPageVisit(currentPath);

        // Get adaptive ranking
        const ranking = getAdaptivePageRanking();

        if (ranking.length === 0) {
            // No data yet, use default order
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setOrderedItems(items);
            return;
        }

        // Reorder items based on ranking
        const sorted = [...items].sort((a, b) => {
            const aIndex = ranking.indexOf(a.href);
            const bIndex = ranking.indexOf(b.href);

            // Items in ranking come first
            if (aIndex !== -1 && bIndex !== -1) {
                return aIndex - bIndex;
            }
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;

            // Keep original order for unranked items
            return items.indexOf(a) - items.indexOf(b);
        });

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrderedItems(sorted);
    }, [currentPath, itemsKey]); // Use stable itemsKey instead of items

    return orderedItems;
}
