/** Routes the buddy screens add to the root stack, reachable from any tab. */
export type BuddyRoutes = {
  BuddiesScreen: undefined;
  MyCardScreen: undefined;
  ScanCardScreen: undefined;
  CardPreviewScreen: { code: string };
  BuddyDetailScreen: { uid: string; displayName?: string | null };
  BuddyActivityScreen: undefined;
  BuddyPlansScreen: undefined;
  BuddyPlanScreen: { ownerUid: string; planId: string; ownerName: string | null };
};
