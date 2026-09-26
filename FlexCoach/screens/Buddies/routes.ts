/** Routes the buddy screens add to the root stack, reachable from any tab. */
export type BuddyRoutes = {
  BuddiesScreen: undefined;
  MyCardScreen: undefined;
  ScanCardScreen: undefined;
  /** Someone's Iron Card: by card code (a scan or a link) or by uid (a row in the list). */
  BuddyCardScreen: { code?: string; uid?: string; displayName?: string | null };
  BuddyActivityScreen: undefined;
  BuddyPlansScreen: undefined;
  BuddyPlanScreen: { ownerUid: string; planId: string; ownerName: string | null };
};
