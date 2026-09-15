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

export const isEngagementVisibleToUser = <Record extends AssignedEngagementRecord>(
  engagement: Record,
  userAppId: string | null,
  isManager: boolean,
) => isManager || (userAppId !== null && engagement.assignedClientAppIds?.includes(userAppId) === true);

export const isEngagementMutableByUser = <Record extends AssignedEngagementRecord>(
  _engagement: Record,
  _userAppId: string | null,
  isManager: boolean,
) => isManager;

export const canUpdateEngagementTaskStatus = <Record extends AssignedEngagementRecord>(
  engagement: Record,
  userAppId: string | null,
  isManager: boolean,
) => isManager || isEngagementVisibleToUser(engagement, userAppId, false);

export const isClientInteractionVisibleToUser = <
  Interaction extends ClientInteractionRecord,
  Engagement extends AssignedEngagementRecord,
>(
  interaction: Interaction,
  engagements: Engagement[],
  userAppId: string | null,
  isManager: boolean,
) => {
  if (isManager) return true;
  if (!userAppId || !interaction.engagementId) return false;

  const engagement = engagements.find((candidate) => candidate.id === interaction.engagementId);
  return (
    engagement !== undefined &&
    isEngagementVisibleToUser(engagement, userAppId, false) &&
    (interaction.submittedByAppId === undefined || interaction.submittedByAppId === userAppId)
  );
};

export const isClientInteractionMutableByUser = <Record extends ClientInteractionRecord>(
  interaction: Record,
  userAppId: string | null,
  isManager: boolean,
) => isManager || (userAppId !== null && interaction.submittedByAppId === userAppId);

export const mergeVisibleEngagements = <Record extends AssignedEngagementRecord>(
  fullCollection: Record[],
  visibleCollection: Record[],
  userAppId: string | null,
  isManager: boolean,
) => {
  if (isManager) return visibleCollection;

  const visibleById = new Map(visibleCollection.map((engagement) => [engagement.id, engagement]));
  return fullCollection.map((engagement) =>
    isEngagementVisibleToUser(engagement, userAppId, false)
      ? visibleById.get(engagement.id) ?? engagement
      : engagement,
  );
};

export const isVisibleToUser = <Record extends PartitionedRecord>(
  record: Record,
  userAppId: string | null,
  isManager: boolean,
) => isManager || record.appId === undefined || record.appId === userAppId;

export const isMutableByUser = <Record extends PartitionedRecord>(
  record: Record,
  userAppId: string | null,
  isManager: boolean,
) => isManager || (userAppId !== null && record.appId === userAppId);

export const mergeAuthorizedPartition = <Record extends PartitionedRecord>(
  fullCollection: Record[],
  visibleCollection: Record[],
  userAppId: string | null,
  isManager: boolean,
) => {
  if (isManager) return visibleCollection;

  return [
    ...fullCollection.filter((record) => record.appId !== userAppId),
    ...visibleCollection.filter((record) => record.appId === userAppId),
  ];
};