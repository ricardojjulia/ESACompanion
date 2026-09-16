import type { Project } from '../types/project';

/** Architect can see and mutate everything; client can see all (data is already scoped by import). */
export const isProjectVisibleToUser = (_project: Project, _isManager: boolean) => true;

export const isProjectMutableByUser = (_project: Project, isManager: boolean) => isManager;

export const canUpdateProjectTaskStatus = (_project: Project, isManager: boolean) => true;

export const canManageTaskNotes = (_project: Project, isManager: boolean) => true;

export const mergeProjects = (
  fullCollection: Project[],
  nextCollection: Project[],
  isManager: boolean,
): Project[] => nextCollection;

// ---------------------------------------------------------------------------
// Legacy exports kept so old files that still import them compile without errors.
// These are safe no-ops: the old Engagements page is no longer routed.
// ---------------------------------------------------------------------------

export interface PartitionedRecord {
  id: string;
  appId?: string;
}

export interface AssignedEngagementRecord {
  id: string;
  assignedClientAppIds?: string[];
}

export interface ClientInteractionRecord {
  engagementId?: string;
  submittedByAppId?: string;
}

export const isEngagementVisibleToUser = <R extends AssignedEngagementRecord>(
  _engagement: R,
  _userAppId: string | null,
  _isManager: boolean,
) => true;

export const isEngagementMutableByUser = <R extends AssignedEngagementRecord>(
  _engagement: R,
  _userAppId: string | null,
  isManager: boolean,
) => isManager;

export const canUpdateEngagementTaskStatus = <R extends AssignedEngagementRecord>(
  _engagement: R,
  _userAppId: string | null,
  _isManager: boolean,
) => true;

export const isClientInteractionVisibleToUser = <
  I extends ClientInteractionRecord,
  E extends AssignedEngagementRecord,
>(
  _interaction: I,
  _engagements: E[],
  _userAppId: string | null,
  _isManager: boolean,
) => true;

export const isClientInteractionMutableByUser = <R extends ClientInteractionRecord>(
  _interaction: R,
  _userAppId: string | null,
  isManager: boolean,
) => isManager;

export const mergeVisibleEngagements = <R extends AssignedEngagementRecord>(
  _full: R[],
  visible: R[],
  _userAppId: string | null,
  _isManager: boolean,
) => visible;

export const isVisibleToUser = <R extends PartitionedRecord>(
  _record: R,
  _userAppId: string | null,
  _isManager: boolean,
) => true;

export const isMutableByUser = <R extends PartitionedRecord>(
  _record: R,
  _userAppId: string | null,
  isManager: boolean,
) => isManager;

export const mergeAuthorizedPartition = <R extends PartitionedRecord>(
  _full: R[],
  visible: R[],
  _userAppId: string | null,
  _isManager: boolean,
) => visible;
