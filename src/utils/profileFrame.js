// Public profile responses have used a few frame shapes over time. Resolve
// them in one place so other users are not dependent on the owner's local
// auth metadata/localStorage to see the equipped frame.
export function resolveProfileFrame(profile, milestones = []) {
  const frame =
    profile?.current_frame ||
    profile?.currentFrame ||
    profile?.equipped_frame ||
    profile?.equippedFrame ||
    profile?.profile_frame ||
    null;
  const selectedFrameId =
    profile?.current_frame_id ||
    profile?.currentFrameId ||
    profile?.profile_frame_id ||
    profile?.user_metadata?.profile_frame_id ||
    null;
  const embeddedFrameId =
    frame?.id ||
    frame?.reward_item_id ||
    null;
  const frameId = selectedFrameId || embeddedFrameId;
  const matchedMilestone = milestones.find((milestone) =>
    [milestone?.id, milestone?.reward_item_id, milestone?.reward?.id]
      .filter(Boolean)
      .some((candidate) => String(candidate) === String(frameId)),
  );

  // During an instant frame change, current_frame can still contain the
  // previously equipped object while current_frame_id already contains the
  // new selection. In that case the explicit ID is authoritative.
  const embeddedFrameIsCurrent = !selectedFrameId
    || (embeddedFrameId && String(selectedFrameId) === String(embeddedFrameId));
  const resolvedFrame = embeddedFrameIsCurrent
    ? (frame || matchedMilestone)
    : (matchedMilestone || frame);
  const previewUrl =
    resolvedFrame?.image_url ||
    resolvedFrame?.imageUrl ||
    resolvedFrame?.preview_url ||
    resolvedFrame?.previewUrl ||
    resolvedFrame?.metadata?.image_url ||
    resolvedFrame?.metadata?.imageUrl ||
    resolvedFrame?.metadata?.preview_url ||
    resolvedFrame?.metadata?.previewUrl ||
    resolvedFrame?.reward_item?.image_url ||
    resolvedFrame?.reward?.image_url ||
    resolvedFrame?.reward?.previewUrl ||
    profile?.current_frame_image_url ||
    matchedMilestone?.reward?.previewUrl ||
    null;

  return { frameId, frame: resolvedFrame, previewUrl };
}
