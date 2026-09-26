import type { NavigatorScreenParams } from '@react-navigation/native';

/** A person's Iron Card: by card code (a scan or a link) or by uid (a row in the list). */
export type BuddyCardParams = { code?: string; uid?: string; displayName?: string | null };
export type BuddyPlanParams = { ownerUid: string; planId: string; ownerName: string | null };

/**
 * The Iron Card sheet: your card at the root, the scanner and whatever a
 * scan leads to pushed inside it, so the sheet navigates within itself
 * instead of stacking more sheets.
 */
export type CardStackParams = {
  MyCardScreen: undefined;
  ScanCardScreen: undefined;
  BuddyCardScreen: BuddyCardParams;
  BuddyPlanScreen: BuddyPlanParams;
};

/** Routes the buddy screens add to the root stack, reachable from any tab. */
export type BuddyRoutes = {
  BuddiesScreen: undefined;
  CardStack: NavigatorScreenParams<CardStackParams> | undefined;
  BuddyCardScreen: BuddyCardParams;
  BuddyActivityScreen: undefined;
  BuddyPlansScreen: undefined;
  BuddyPlanScreen: BuddyPlanParams;
};
