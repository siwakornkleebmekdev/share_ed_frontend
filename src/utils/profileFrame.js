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
  const frameId =
    profile?.current_frame_id ||
    profile?.currentFrameId ||
    profile?.profile_frame_id ||
    profile?.user_metadata?.profile_frame_id ||
    frame?.id ||
    frame?.reward_item_id ||
    null;
  const matchedMilestone = milestones.find((milestone) =>
    [milestone?.id, milestone?.reward_item_id, milestone?.reward?.id]
      .filter(Boolean)
      .some((candidate) => String(candidate) === String(frameId)),
  );
  const previewUrl =
    frame?.image_url ||
    frame?.imageUrl ||
    frame?.preview_url ||
    frame?.previewUrl ||
    frame?.reward_item?.image_url ||
    frame?.reward?.image_url ||
    frame?.reward?.previewUrl ||
    profile?.current_frame_image_url ||
    matchedMilestone?.reward?.previewUrl ||
    null;

  return { frameId, frame: matchedMilestone || frame, previewUrl };
}
